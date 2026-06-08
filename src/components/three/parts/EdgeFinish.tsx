import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  edgeFinishConfigs,
  type EdgeFinishVisualType,
} from '../utils/geometryUtils';
import { StonePhysicalMaterial } from '../utils/stoneMaterials';

type StoneEdgeProps = {
  width: number;
  depth: number;
  thickness: number;
  stoneName: string;
  texture: THREE.Texture | null;
};

type EdgeProfileProps = StoneEdgeProps & {
  edgeFinishType: EdgeFinishVisualType;
};

export function JoinShadow({
  width,
  position,
}: {
  width: number;
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 0.006, 0.006]} />
      <meshBasicMaterial
        color="#191715"
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </mesh>
  );
}

function StoneEdgeMaterial({
  stoneName,
  texture,
  colorOffset = -0.035,
}: {
  stoneName: string;
  texture: THREE.Texture | null;
  colorOffset?: number;
}) {
  return (
    <StonePhysicalMaterial
      stoneName={stoneName}
      texture={texture}
      colorOffset={colorOffset}
      roughnessOffset={0.035}
    />
  );
}

function BullnoseFrontEdge({
  width,
  thickness,
  depth,
  stoneName,
  texture,
}: StoneEdgeProps) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, 0, depth / 2 + thickness * 0.11]}
      rotation={[0, 0, Math.PI / 2]}
      scale={[1, 0.46, 1]}
    >
      <cylinderGeometry
        args={[
          thickness * 0.52,
          thickness * 0.52,
          width * 0.986,
          36,
          1,
          false,
          Math.PI / 2,
          Math.PI,
        ]}
      />
      <StoneEdgeMaterial stoneName={stoneName} texture={texture} />
    </mesh>
  );
}

function HalfBullnoseFrontEdge({
  width,
  thickness,
  depth,
  stoneName,
  texture,
}: StoneEdgeProps) {
  const radius = Math.min(0.034, Math.max(0.022, thickness * 0.22));

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, thickness / 2 - radius * 0.52, depth / 2 + radius * 0.16]}
      >
        <RoundedBox
          args={[width * 0.986, radius * 1.16, radius * 1.16]}
          radius={radius * 0.46}
          smoothness={10}
        >
          <StoneEdgeMaterial stoneName={stoneName} texture={texture} />
        </RoundedBox>
      </mesh>
      <mesh position={[0, -thickness * 0.07, depth / 2 + 0.004]}>
        <boxGeometry args={[width * 0.972, thickness * 0.78, 0.004]} />
        <meshBasicMaterial
          color="#151311"
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Miter45FrontEdge({
  width,
  thickness,
  depth,
  stoneName,
  texture,
}: StoneEdgeProps) {
  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, -thickness * 0.05, depth / 2 + thickness * 0.13]}
        rotation={[-0.38, 0, 0]}
      >
        <boxGeometry args={[width * 0.986, thickness * 0.94, thickness * 0.18]} />
        <StoneEdgeMaterial
          stoneName={stoneName}
          texture={texture}
          colorOffset={-0.045}
        />
      </mesh>
      <JoinShadow
        width={width * 0.955}
        position={[0, thickness / 2 - 0.006, depth / 2 + thickness * 0.02]}
      />
      <mesh position={[0, -thickness / 2 + 0.008, depth / 2 + thickness * 0.23]}>
        <boxGeometry args={[width * 0.95, 0.005, 0.004]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function StraightFrontEdge({
  width,
  thickness,
  depth,
}: Pick<StoneEdgeProps, 'width' | 'thickness' | 'depth'>) {
  return (
    <group>
      <mesh position={[0, thickness / 2 - 0.004, depth / 2 + 0.004]}>
        <boxGeometry args={[width * 0.962, 0.004, 0.004]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -thickness / 2 + 0.006, depth / 2 + 0.004]}>
        <boxGeometry args={[width * 0.948, 0.004, 0.004]} />
        <meshBasicMaterial
          color="#1b1714"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function FrontEdgeFinish({
  width,
  depth,
  thickness,
  stoneName,
  texture,
  edgeFinishType,
}: EdgeProfileProps) {
  if (edgeFinishType === 'halfBullnose') {
    return (
      <HalfBullnoseFrontEdge
        width={width}
        depth={depth}
        thickness={thickness}
        stoneName={stoneName}
        texture={texture}
      />
    );
  }

  if (edgeFinishType === 'bullnose') {
    return (
      <BullnoseFrontEdge
        width={width}
        depth={depth}
        thickness={thickness}
        stoneName={stoneName}
        texture={texture}
      />
    );
  }

  if (edgeFinishType === 'miter45') {
    return (
      <Miter45FrontEdge
        width={width}
        depth={depth}
        thickness={thickness}
        stoneName={stoneName}
        texture={texture}
      />
    );
  }

  return <StraightFrontEdge width={width} depth={depth} thickness={thickness} />;
}

export function EdgeFinish({
  width,
  depth,
  thickness,
  stoneName,
  texture,
  edgeFinishType,
}: EdgeProfileProps) {
  const config = edgeFinishConfigs[edgeFinishType];
  const frontHighlightY =
    edgeFinishType === 'miter45' ? thickness / 2 - 0.018 : thickness / 2 - 0.006;

  return (
    <group>
      <FrontEdgeFinish
        width={width}
        depth={depth}
        thickness={thickness}
        stoneName={stoneName}
        texture={texture}
        edgeFinishType={edgeFinishType}
      />
      <mesh position={[0, thickness / 2 - 0.003, depth / 2 - 0.004]}>
        <boxGeometry args={[width - 0.004, config.topHighlightHeight, 0.010]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={edgeFinishType === 'straight' ? 0.18 : 0.28}
          roughness={0.05}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, frontHighlightY, depth / 2 + 0.002]}>
        <boxGeometry args={[width - 0.012, config.faceHighlightHeight, 0.003]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={config.faceHighlightOpacity}
          roughness={0.08}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
