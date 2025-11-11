import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import * as lil from 'lil-gui';
import * as demos from './demos';

const canvas = new Canvas({
  container: 'container',
  width: 500,
  height: 500,
  renderer: new Renderer(),
});

// GUI
const $container = document.getElementById('container');
const gui = new lil.GUI({ autoPlace: false });
$container.appendChild(gui.domElement);

const select = document.createElement('select');
select.id = 'example-select';
select.style.margin = '1em';
select.onchange = onChange;
select.style.display = 'block';
document.body.append(select);

const options = Object.keys(demos).map((d) => {
  const option = document.createElement('option');
  option.textContent = d;
  option.value = d;
  return option;
});
options.forEach((d) => select.append(d));

const initialValue = new URL(window.location.href).searchParams.get('name');
if (initialValue && initialValue in demos) {
  select.value = initialValue;
}

render();

function render() {
  canvas.removeChildren();

  const demo = demos[select.value as keyof typeof demos];
  demo(canvas, gui);
}

function onChange() {
  const { value } = select;
  history.pushState({ value }, '', `?name=${value}`);
  render();
}
