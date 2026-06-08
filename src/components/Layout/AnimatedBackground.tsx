import { useState, type MouseEvent, type CSSProperties } from 'react';
import { View as BitsView } from 'react-bits';

const View = BitsView as any;

export default function AnimatedBackground() {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  return (
    <View
      className="animated-background"
      onMouseMove={(event: MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setPosition({ x, y });
      }}
      onMouseLeave={() => setPosition({ x: 50, y: 50 })}
      style={
        {
          '--x': `${position.x}%`,
          '--y': `${position.y}%`,
        } as CSSProperties
      }
    >
      <View className="bg-glow bg-glow-1" />
      <View className="bg-glow bg-glow-2" />
      <View className="bg-shape bg-shape-1" />
      <View className="bg-shape bg-shape-2" />
    </View>
  );
}
