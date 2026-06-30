import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Nie znaleziono kontenera #app.');

export default mount(App, { target });
