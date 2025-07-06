import { Edge } from './edge';
import { Node } from './node';
import { type TNodesEdgesMap } from './types';

// 用于匹配 antv 数据渲染
export class Mapping {
  outputMap: TNodesEdgesMap;
  graphSize: {
    width: number;
    height: number;
  };
  constructor(outputString: string, outputMap: TNodesEdgesMap) {
    this.outputMap = [];
    this.graphSize = { width: 0, height: 0 };
    this.setLayouts(outputString, outputMap);
  }
  public getLayoutMap(): Mapping['outputMap'] {
    return this.outputMap;
  }
  public getGraphSize(): Mapping['graphSize'] {
    return this.graphSize;
  }
  private setLayouts(outputString: string, outputMap: TNodesEdgesMap) {
    const svgDoc = new DOMParser().parseFromString(outputString, 'image/svg+xml');
    const nodeElements = svgDoc.querySelectorAll('.node');
    const edgeElements = svgDoc.querySelectorAll('.edge');

    outputMap.forEach((item, idx) => {
      if (item instanceof Node) {
        this.setNodeLayout(item, nodeElements, idx);
      } else if (item instanceof Edge) {
        this.setEdgeLayout(item, edgeElements, idx);
      }
    });
    this.outputMap = outputMap;
    this.calculateGraphSize(svgDoc);
  }
  private setNodeLayout(node: Node, nodeElements: NodeListOf<Element>, idx: number) {
    const targetEle = this.findElementByTitle(nodeElements, idx.toString());
    if (!targetEle) {
      return;
    }
    const ellipseEle = targetEle.querySelector('ellipse');
    // 起止节点
    if (ellipseEle) {
      node.setLayout({
        position: {
          x: parseFloat(ellipseEle.getAttribute('cx') ?? '0'),
          y: parseFloat(ellipseEle.getAttribute('cy') ?? '0'),
        },
        size: {
          width: parseFloat(ellipseEle.getAttribute('rx') ?? '0'),
          height: parseFloat(ellipseEle.getAttribute('ry') ?? '0'),
        },
      });
    } else {
      const polygonEle = targetEle.querySelector('polygon');
      node.setLayout(this.getPolygonAttributes(polygonEle));
    }
  }
  private setEdgeLayout(edge: Edge, edgeElements: NodeListOf<Element>, idx: number) {
    const targetEle = this.findElementByClassName(edgeElements, `edge_${idx}`);
    if (!targetEle) {
      return;
    }
    const pathEle = targetEle.querySelector('path');
    const textEle = targetEle.querySelector('text');
    const labelPosition = {
      x: parseFloat(textEle?.getAttribute('x') ?? '0'),
      y: parseFloat(textEle?.getAttribute('y') ?? '0'),
    };
    edge.setLayout(pathEle?.getAttribute('d') ?? '', labelPosition);
  }
  private calculateGraphSize(svgDoc: Document) {
    const svgElement = svgDoc.getElementsByTagName('svg')[0];

    // 获取宽度（添加45px的额外空间）
    const rawWidth = svgElement.getAttribute('width') || '0';
    const width = parseFloat(rawWidth) + 45;

    // 获取高度
    const rawHeight = svgElement.getAttribute('height') || '0';
    const height = parseFloat(rawHeight);

    this.graphSize = { width, height };
  }
  private findElementByTitle(elements: NodeListOf<Element>, title: string) {
    return Array.from(elements).find((e) => {
      const titleEle = e.querySelector('title');
      return titleEle && titleEle.textContent === title;
    });
  }
  private findElementByClassName(elements: NodeListOf<Element>, className: string) {
    return Array.from(elements).find((e) => e.classList.contains(className));
  }
  private getPolygonAttributes(polygon: SVGPolygonElement | null) {
    if (!polygon) return {};
    const { minX, maxX, minY, maxY } = Array.from(polygon.points).reduce(
      (acc, cur) => ({
        minX: Math.min(acc.minX, cur.x),
        maxX: Math.max(acc.maxX, cur.x),
        minY: Math.min(acc.minY, cur.y),
        maxY: Math.max(acc.maxY, cur.y),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );
    return {
      position: {
        x: minX + (maxX - minX) / 2,
        y: minY + (maxY - minY) / 2,
      },
      size: {
        width: maxX - minX,
        height: maxY - minY,
      },
    };
  }
}
