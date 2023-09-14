// Default attributes list:
// https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram

// Note: In OpenGL, "verying" was changed to explicit "in"/"out" variables to account for the
// shading stages beyond simply vert and frag. OpenGL ES still only uses vert and frag though
// and inherits the older terminology.
varying vec2 vertexUV;
varying vec3 vertexNormal;

void main(){
  // uv, normal, normalMatrix automatically provided by WebGLProgram compiler
  vertexUV=uv;
  vertexNormal=normalize(normalMatrix*normal);
  
  // projectionMatrix, modelViewMatrix, position, added with "WebGLProgram"
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
