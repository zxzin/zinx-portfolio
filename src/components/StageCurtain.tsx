import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArcadeMotion } from "../lib/arcade-state";

/** Camera-facing cloth: vertices gather locally, with a delayed hanging hem. */
export default function StageCurtain({ motion }: { motion: ArcadeMotion }) {
  const root = useRef<THREE.Group>(null);
  useFrame(({ camera, size }) => {
    if (!root.current) return;
    root.current.visible = motion.curtain < .999;
    if (!root.current.visible) return;
    root.current.position.copy(camera.position);
    root.current.quaternion.copy(camera.quaternion);
    root.current.translateZ(-2);
    const height = 4 * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    root.current.children.forEach(child => {
      const uniforms = (child as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material.uniforms;
      uniforms.extent.value.set(height * size.width / size.height, height);
      uniforms.progress.value = motion.curtain;
    });
  });
  return <group ref={root} name="gathering-velvet-curtain">
    {[-1, 1].map(side => <mesh key={side} frustumCulled={false} renderOrder={200}>
      <planeGeometry args={[1, 1, 144, 64]} />
      <shaderMaterial transparent side={THREE.DoubleSide} depthTest depthWrite toneMapped={false}
        uniforms={{ progress: { value: 0 }, extent: { value: new THREE.Vector2() }, side: { value: side } }}
        vertexShader={`
          uniform float progress; uniform float side; uniform vec2 extent;
          varying vec2 clothUv; varying vec3 clothPoint; varying vec3 clothNormal; varying float foldShade;
          vec3 surface(vec2 coord) {
            float u=coord.x, v=coord.y, p=progress;
            // The rail leads; the belly and hem follow with weight and inertia.
            float lag=.17*pow(1.-v,.7)*sin(p*3.14159);
            float pull=clamp(p-lag,0.,1.);
            float gather=1.-.88*pull;
            float ripple=sin(u*17.+v*8.-p*13.)*sin(p*3.14159);
            float phase=u*62.83185+.42*sin(v*4.+u*5.)+.45*ripple;
            float folds=sin(phase)+.22*sin(phase*2.+.5);
            float depth=extent.x*.009*(1.+pull*.8);
            float x=side*(extent.x*.515-u*extent.x*.522*gather+pull*extent.x*.18);
            x+=side*extent.x*.007*ripple*u*(1.-v);
            float y=(v-.5)*extent.y*1.14;
            y+=extent.y*.018*sin(u*9.+p*5.)*pow(1.-v,5.)*(.2+sin(p*3.14159));
            return vec3(x,y,depth*folds);
          }
          void main() {
            clothUv=uv;
            vec3 point=surface(uv);
            vec3 tangent=surface(uv+vec2(.0001,0.))-point;
            vec3 bitangent=surface(uv+vec2(0.,.0001))-point;
            clothNormal=normalMatrix*normalize(cross(tangent,bitangent));
            foldShade=clamp(.5+point.z/(extent.x*.022),0.,1.);
            vec4 mv=modelViewMatrix*vec4(point,1.);
            clothPoint=mv.xyz;
            gl_Position=projectionMatrix*mv;
          }`}
        fragmentShader={`
          varying vec2 clothUv; varying vec3 clothPoint; varying vec3 clothNormal; varying float foldShade;
          void main(){
            vec3 n=normalize(clothNormal);
            if(n.z<0.) n=-n;
            vec3 viewDir=normalize(-clothPoint);
            float light=max(0.,dot(n,normalize(vec3(-.45,.65,1.))));
            float velvet=pow(1.-abs(dot(n,viewDir)),2.2);
            float occlusion=mix(.52,1.,smoothstep(.0,.8,foldShade));
            vec2 weaveUv=clothUv*vec2(2900.,1900.);
            float weave=sin(weaveUv.x)*sin(weaveUv.y)/(1.+dot(fwidth(weaveUv),vec2(1.)));
            vec3 red=vec3(.47,.028,.075)*(.48+.64*light)*occlusion;
            red+=vec3(.24,.055,.068)*velvet;
            red*=1.+.025*weave;
            red*=.65+.35*smoothstep(0.,.3,clothUv.y);
            // Woven gold piping follows the same deformed surface as the velvet.
            float seam=smoothstep(.988,.994,clothUv.x);
            vec3 gold=vec3(.67,.44,.19)*(.45+.65*light)+vec3(.2,.16,.08)*pow(light,8.);
            gl_FragColor=vec4(mix(red,gold,seam),1.);
          }`} />
    </mesh>)}
  </group>;
}
