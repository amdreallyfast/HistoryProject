varying vec3 vertexNormal;

void main(){
  vec3 atmosphereColor=vec3(.3,.6,1.);
  vec3 zAxisTowardsCamera=vec3(0.,0.,1.);
  float intensity=pow(.6-dot(vertexNormal,zAxisTowardsCamera),2.);
  float alpha=1.;
  
  gl_FragColor=vec4(atmosphereColor,alpha)*intensity;
}
