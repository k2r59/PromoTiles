import { createApp } from 'vue'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import './style.css'
import './mobile-layout.css'
import App from './App.vue'
// /api/app is a network-only entry point for clients running an older cached shell.
if(location.pathname==='/api/app')history.replaceState(null,'','/')
createApp(App).mount('#app')
