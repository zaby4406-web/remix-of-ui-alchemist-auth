import { useEffect, useRef } from "react";

interface ChainBackgroundProps {
  isActive: boolean;
}

interface Node {
  x: number;
  y: number;
  element: HTMLDivElement;
}

const ChainBackground = ({ isActive }: ChainBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const highlight = highlightRef.current;

    // Clear existing nodes and lines
    container.querySelectorAll('.chain-node, .chain-line').forEach(el => el.remove());
    nodesRef.current = [];

    const nodeCount = 50;
    const nodes: Node[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const node = document.createElement('div');
      node.className = 'chain-node';
      
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      
      node.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        transition: all 0.3s ease;
        box-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
      `;
      
      nodes.push({ element: node, x, y });
      container.appendChild(node);
    }

    // Create connections between nearby nodes
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i !== j) {
          const distance = Math.sqrt(
            Math.pow(nodeA.x - nodeB.x, 2) + 
            Math.pow(nodeA.y - nodeB.y, 2)
          );
          
          if (distance < 150) {
            const line = document.createElement('div');
            line.className = 'chain-line';
            
            const angle = Math.atan2(nodeB.y - nodeA.y, nodeB.x - nodeA.x);
            
            line.style.cssText = `
              position: absolute;
              height: 2px;
              background: rgba(255, 255, 255, 0.2);
              left: ${nodeA.x}px;
              top: ${nodeA.y}px;
              width: ${distance}px;
              transform: rotate(${angle}rad);
              transform-origin: left center;
              transition: all 0.3s ease;
              box-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
            `;
            
            container.appendChild(line);
          }
        }
      });
    });

    nodesRef.current = nodes;

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      if (!highlight) return;
      
      const x = e.clientX - 125;
      const y = e.clientY - 125;
      
      highlight.style.left = x + 'px';
      highlight.style.top = y + 'px';
      
      // Highlight nearby nodes and lines
      const nodeElements = container.querySelectorAll('.chain-node');
      const lineElements = container.querySelectorAll('.chain-line');
      
      nodeElements.forEach(node => {
        const rect = node.getBoundingClientRect();
        const nodeX = rect.left + rect.width / 2;
        const nodeY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(e.clientX - nodeX, 2) + 
          Math.pow(e.clientY - nodeY, 2)
        );
        
        if (distance < 125) {
          (node as HTMLElement).style.background = 'rgba(255, 255, 255, 1)';
          (node as HTMLElement).style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.8), 0 0 24px rgba(255, 255, 255, 0.4)';
          (node as HTMLElement).style.transform = 'scale(1.5)';
        } else {
          (node as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
          (node as HTMLElement).style.boxShadow = '0 0 2px rgba(255, 255, 255, 0.2)';
          (node as HTMLElement).style.transform = 'scale(1)';
        }
      });
      
      lineElements.forEach(line => {
        const rect = line.getBoundingClientRect();
        const lineX = rect.left + rect.width / 2;
        const lineY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(e.clientX - lineX, 2) + 
          Math.pow(e.clientY - lineY, 2)
        );
        
        if (distance < 125) {
          (line as HTMLElement).style.background = 'rgba(255, 255, 255, 0.9)';
          (line as HTMLElement).style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 255, 255, 0.3)';
        } else {
          (line as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
          (line as HTMLElement).style.boxShadow = '0 0 2px rgba(255, 255, 255, 0.1)';
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 opacity-10 z-[1] pointer-events-none"
    >
      <div 
        ref={highlightRef}
        className="absolute w-64 h-64 rounded-full pointer-events-none z-[2] transition-all duration-100"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.2) 60%, transparent 80%)',
          boxShadow: '0 0 80px rgba(255,255,255,0.6), 0 0 120px rgba(255,255,255,0.3)'
        }}
      />
    </div>
  );
};

export default ChainBackground;
