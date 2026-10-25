"""Distribute repeated musical attacks between hands without changing their timing."""
def balance_gestures(notes):
    busy = [-10.0] * 4
    history = []
    for note in notes:
        preferred = note['lane']
        available = [lane for lane in range(4) if busy[lane] + .14 < note['timeSeconds']]
        recent = history[-15:]
        def acceptable(lane):
            return not (len(history) >= 2 and history[-2:] == [lane, lane]) and recent.count(lane) < 8
        candidates = [lane for lane in available if acceptable(lane)]
        if preferred in candidates:
            lane = preferred
        else:
            order = list(dict.fromkeys([(preferred + 2) % 4, 3 - preferred, (preferred + 1) % 4, preferred, (preferred + 3) % 4]))
            lane = min(candidates or available, key=lambda lane: (recent.count(lane), order.index(lane)))
        note['lane'] = lane
        history.append(lane)
        if note['type'] == 'hold':
            busy[lane] = note['timeSeconds'] + note['durationSeconds']
    return notes
