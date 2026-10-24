"""Run the installed audio2score MCP on a local file and retain a report."""
import asyncio
import json
import os
from pathlib import Path
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER = Path(os.environ.get('AUDIO2SCORE_ROOT', str(Path.home() / '.local/share/audio2score-mcp'))).expanduser().resolve()

async def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage: python transcribe_mcp.py SOURCE_MP3 OUTPUT_DIRECTORY')
    if not (SERVER / '.venv/bin/python').is_file() or not (SERVER / 'mcp_server.py').is_file():
        raise SystemExit(f'audio2score introuvable dans {SERVER}. Définir AUDIO2SCORE_ROOT vers son installation.')
    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    params = StdioServerParameters(command=str(SERVER / '.venv/bin/python'), args=[str(SERVER / 'mcp_server.py')], env={'PYTHONUNBUFFERED': '1'})
    with (output / 'mcp-server.log').open('w') as log:
        async with stdio_client(params, errlog=log) as (read, write):
            async with ClientSession(read, write, read_timeout_seconds=600) as session:
                await session.initialize()
                print('MCP connecté : transcription du morceau complet.', flush=True)
                results = {}
                for tool, args, target in [
                    ('transcribe_audio', {'audio_path': str(source)}, source.with_suffix('.mid')),
                    ('score_to_notes', {'score_path': str(source.with_suffix('.mid'))}, source.with_suffix('.notes.json')),
                ]:
                    if target.exists():
                        print(f'Réutilisation du fichier existant : {target.name}', flush=True)
                        continue
                    result = await session.call_tool(tool, args)
                    data = result.model_dump(mode='json', by_alias=True)
                    results[tool] = data
                    if result.is_error:
                        (output / 'mcp-result.json').write_text(json.dumps(results, indent=2))
                        raise RuntimeError(data)
                    print(f'{tool} terminé : {target.name}', flush=True)
                (output / 'mcp-result.json').write_text(json.dumps(results, indent=2))

asyncio.run(main())
