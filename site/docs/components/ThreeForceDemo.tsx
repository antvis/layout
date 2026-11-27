import type { Layout } from '@antv/layout/lib/algorithm/types.js';
import type { GraphEdge, GraphNode } from '@antv/layout/lib/types/data.js';
import { useEffect, useRef, useState } from 'react';
import type { LayoutDemoConfig } from './layoutDemoConfigs';

const PALETTE = [0x93c5fd, 0x86efac, 0xc4b5fd, 0xf9a8d4, 0xfcd34d, 0x67e8f9];

export function ThreeForceDemo({ config }: { config: LayoutDemoConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    setStatus('loading');
    setError('');
    if (containerRef.current) containerRef.current.replaceChildren();

    const setup = async () => {
      const [THREE, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
      ]);
      if (cancelled || !containerRef.current) return;

      const container = containerRef.current;
      const scene = new THREE.Scene();
      const root = new THREE.Group();
      scene.add(root);
      const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 2000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.55;
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });

      scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.2));
      const directional = new THREE.DirectionalLight(0xffffff, 2.4);
      directional.position.set(80, 120, 100);
      scene.add(directional);

      const sphere = new THREE.SphereGeometry(4, 20, 14);
      const disposables: Array<{ dispose: () => void }> = [sphere];
      const nodes = new Map<string, any>();
      const labels = new Map<string, any>();
      const edgeLines: any[] = [];

      const createLabel = (text: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d')!;
        context.font = '500 24px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#334155';
        context.fillText(text, 128, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(30, 7.5, 1);
        disposables.push(texture, material);
        return sprite;
      };

      const render = (layoutNodes: GraphNode[], layoutEdges: GraphEdge[]) => {
        const ids = new Set(layoutNodes.map((node) => String(node.id)));
        layoutNodes.forEach((node, index) => {
          const id = String(node.id);
          if (!nodes.has(id)) {
            const material = new THREE.MeshStandardMaterial({
              color: PALETTE[index % PALETTE.length],
              roughness: 0.45,
              metalness: 0.08,
            });
            const mesh = new THREE.Mesh(sphere, material);
            root.add(mesh);
            nodes.set(id, mesh);
            disposables.push(material);
          }
          if (!labels.has(id)) {
            const label = createLabel(String(node._original.label ?? node.id));
            root.add(label);
            labels.set(id, label);
          }
          nodes.get(id).position.set(node.x, node.y, node.z ?? 0);
          labels.get(id).position.set(node.x, node.y + 8, node.z ?? 0);
        });
        for (const [id, mesh] of nodes) {
          if (!ids.has(id)) {
            root.remove(mesh);
            nodes.delete(id);
          }
        }
        for (const [id, label] of labels) {
          if (!ids.has(id)) {
            root.remove(label);
            labels.delete(id);
          }
        }

        edgeLines.forEach((line) => {
          root.remove(line);
          line.geometry.dispose();
          line.material.dispose();
        });
        edgeLines.length = 0;
        layoutEdges.forEach((edge) => {
          if (!edge.sourceNode || !edge.targetNode) return;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              edge.sourceNode.x,
              edge.sourceNode.y,
              edge.sourceNode.z ?? 0,
            ),
            new THREE.Vector3(
              edge.targetNode.x,
              edge.targetNode.y,
              edge.targetNode.z ?? 0,
            ),
          ]);
          const material = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.5,
          });
          const line = new THREE.Line(geometry, material);
          edgeLines.push(line);
          root.add(line);
        });
      };

      const fitCamera = (layoutNodes: GraphNode[]) => {
        if (!layoutNodes.length) return;
        const bounds = new THREE.Box3();
        layoutNodes.forEach((node) => {
          bounds.expandByPoint(new THREE.Vector3(node.x, node.y, node.z ?? 0));
        });
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const radius = Math.max(size.length() / 2, 35);
        camera.near = Math.max(radius / 100, 0.1);
        camera.far = radius * 12;
        camera.updateProjectionMatrix();
        camera.position.set(
          center.x + radius * 1.15,
          center.y + radius * 0.75,
          center.z + radius * 1.65,
        );
        controls.target.copy(center);
        controls.minDistance = radius * 0.45;
        controls.maxDistance = radius * 5;
        controls.update();
      };

      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const draw = (layout: Layout<any>) => {
        if (cancelled) return;
        const layoutNodes: GraphNode[] = [];
        const layoutEdges: GraphEdge[] = [];
        layout.forEachNode((node) => layoutNodes.push(node));
        layout.forEachEdge((edge) => layoutEdges.push(edge));
        render(layoutNodes, layoutEdges);
      };
      const layout = config.createLayout(draw);
      dispose = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        layout.destroy();
        edgeLines.forEach((line) => {
          line.geometry.dispose();
          line.material.dispose();
        });
        disposables.forEach((item) => item.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };

      await layout.execute(structuredClone(config.data));
      if (cancelled) return;
      draw(layout);
      const finalNodes: GraphNode[] = [];
      layout.forEachNode((node) => finalNodes.push(node));
      fitCamera(finalNodes);
      setStatus('ready');
    };

    setup().catch((reason: unknown) => {
      if (cancelled) return;
      dispose();
      setStatus('error');
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to initialize WebGL.',
      );
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, [config, runId]);

  return (
    <div className="layoutDemo" data-status={status} data-renderer="three">
      <div className="layoutDemoToolbar">
        <div className="layoutDemoMeta">
          <strong>3D knowledge space · WebGL</strong>
          <span>
            {status === 'loading' ? 'Converging…' : 'Live 3D simulation'}
          </span>
        </div>
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => setRunId((value) => value + 1)}
        >
          Run again
        </button>
      </div>
      <div ref={containerRef} className="layoutDemoCanvas layoutThreeCanvas">
        {status === 'error' && <div className="layoutDemoError">{error}</div>}
      </div>
    </div>
  );
}
