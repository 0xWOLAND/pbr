var since = 0;
var mousepos = [0, 0];
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl");
var datInput = {
  renderSmoothen: 1000,
  depth: 0.0,
  Scale: 2.0,
  Power: 1.0,
  Offset: 1.0,
  Rotation: 1.0,
};
var gui;
function main() {
  gui = initializeGUI();
  if (!gl) {
    return;
  }
  const vert = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;
  const frag = `
    precision highp float;
    uniform vec3      iResolution;
    uniform float     iTime;
    uniform float     depth;
    uniform float     Scale;
    uniform float     Power;
    uniform float     Rotation;
    uniform float     Offset;
    uniform vec4      iMouse;
    precision highp float;

    #define MAXSTEPS 15
    #define z_near 10e-3
    #define Iterations 10 
    // ########################### STRUCTS #############################

    
    struct Ray {
      vec3 pos;
      vec3 dir;
    };

    // ########################## MAIN        ##########################

    float DE(vec3 z) {
      vec3 a1 = vec3(-1.0, 0, 0);
      vec3 a2 = vec3( 1.0, 0, 0);
      vec3 a3 = vec3( 0, 2.0, 0);
      vec3 a4 = vec3(0, sqrt(2.0) / 2.0, 2.0);
      vec3 c;
      int n = 0;
      float dist, d;
      for(int i = 0; i < Iterations; i++) {
        c = a1; dist = length(z-a1);
              d = length(z-a2); if (d < dist) { c = a2; dist=d; }
        d = length(z-a3); if (d < dist) { c = a3; dist=d; }
        d = length(z-a4); if (d < dist) { c = a4; dist=d; }
        z = Scale*z-c*(Scale-1.0);
        n++;
      }
      return length(z) * pow(Scale, float(-n));
    }
    
    vec3 ray_color(Ray r){
      float totalDistance = 0.0;
      int count = 0;
      for (int steps=0; steps < MAXSTEPS; steps++) {
        vec3 p = r.pos + totalDistance * r.dir;
        float distance = DE(p);
        totalDistance += distance;
        if (distance < z_near) break;
        count++;
      }
      return vec3(1.0 - float(count)/float(MAXSTEPS));
    }

    
    void main() {
      vec2 coord = gl_FragCoord.xy / iResolution.xy;
      float aspect_ratio = iResolution.x / iResolution.y;

      vec2 uv = 2.0 * coord - 1.0;
      uv.x *= aspect_ratio;
      
      vec3 target = vec3(0.0);
      vec3 origin = vec3(4.0 * sin(depth), 1.0, -4.0 * cos(depth));
      vec3 dir = normalize(vec3(uv, 1.0));

      dir.xy *= mat2(cos(Rotation), -sin(Rotation), sin(Rotation), cos(Rotation));

      Ray r = Ray(origin, dir);
      gl_FragColor = vec4(ray_color(r), 1.0);
    }
  `;

  const program = webglUtils.createProgramFromSources(gl, [vert, frag]);
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.DYNAMIC_DRAW
  );
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(program);
  var resolution = gl.getUniformLocation(program, "iResolution");
  var time = gl.getUniformLocation(program, "iTime");
  var depth = gl.getUniformLocation(program, "depth");
  var scale = gl.getUniformLocation(program, "Scale");
  var power = gl.getUniformLocation(program, "Power");
  var offset = gl.getUniformLocation(program, "Offset");
  var rotation = gl.getUniformLocation(program, "Rotatoin");
  var mouse = gl.getUniformLocation(program, "iMouse");
  function render(deltaMS) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(resolution, [gl.canvas.width, gl.canvas.height, 0]);
    deltaMS /= datInput.renderSmoothen;
    gl.uniform1f(time, deltaMS);
    gl.uniform1f(depth, datInput.depth);
    gl.uniform1f(scale, datInput.Scale);
    gl.uniform1f(power, datInput.Power);
    gl.uniform1f(offset, datInput.Offset);
    gl.uniform1f(offset, datInput.Rotation);
    gl.uniform4fv(mouse, [mousepos[0], mousepos[1], 0, 0]);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(render);
  }
  window.requestAnimationFrame(render);
}
main();
canvas.addEventListener("mousemove", (e) => {
  mousepos = [e.clientX, Math.max(300, e.clientY)];
});
function initializeGUI() {
  var g = new dat.GUI({ name: "Controls" });
  var inputFolder = g.addFolder("Input");
  inputFolder.add(datInput, "renderSmoothen", 1, 1000);
  inputFolder.add(datInput, "depth", -10, 0);
  inputFolder.add(datInput, "Scale", 0, 5);
  inputFolder.add(datInput, "Power", 0, 5);
  inputFolder.add(datInput, "Offset", 0, 5);
  inputFolder.add(datInput, "Rotation", 0, 3.14);
}
