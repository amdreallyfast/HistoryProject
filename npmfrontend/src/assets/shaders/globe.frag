// Default attributes list:
// https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram

// Custom
uniform sampler2D globeTexture;
varying vec2 vertexUV;
varying vec3 vertexNormal;

void main(){
  // Source: Tutorial "Add Interactive Data Points to Show Country Population"
  //  Chris, in turn, got it from 3JS.
  float intensity=1.05-dot(vertexNormal,vec3(0.,0.,1.));
  vec3 atmostphere=vec3(.3,.6,1.)*pow(intensity,1.5);
  vec3 textureColor=texture2D(globeTexture,vertexUV).xyz;
  float alpha=.7;
  
  // https://thebookofshaders.com/glossary/?search=texture2D
  gl_FragColor=vec4(textureColor+atmostphere,alpha);
}
