import * as demos from './demos';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import * as lil from 'lil-gui';

const canvas = new Canvas({
  container: 'container',
  width: 500,
  height: 500,
  // @ts-ignore
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

const initialValue = new URL(location as any).searchParams.get(
  'name',
) as string;
if ((demos as any)[initialValue]) select.value = initialValue;

render();

function render() {
  canvas.removeChildren();

  const demo = (demos as any)[select.value];
  demo(canvas, gui);
}

function onChange() {
  const { value } = select;
  history.pushState({ value }, '', `?name=${value}`);
  render();
}
