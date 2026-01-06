import { render } from 'solid-js/web';
import App from './App';
import './index.css';

const root = document.createElement('div');
root.id = 'ntr-toolbox-container';
document.body.appendChild(root);

render(() => <App />, root);