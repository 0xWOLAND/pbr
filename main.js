var since = 0;
var mousepos = [0, 0];
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl");
var datInput = {
  renderSmoothen: 1000,
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
    uniform vec4      iMouse;
    precision highp float;

    #define depth -1.0
    // ########################### STRUCTS #############################

    
    struct Ray {
      vec3 pos;
      vec3 dir;
    };

    // ########################## HELPERS     ##########################

    vec3 at(Ray r, float t) {
      return r.pos + r.dir * t;
    }

    float hit_sphere(vec3 center, float radius, Ray r) {
      vec3 oc = r.pos - center;
      float a = dot(r.dir, r.dir);
      float b = 2.0 * dot(oc, r.dir);
      float c = dot(oc, oc) - radius * radius;
      float disc = b * b - 4.0 * a * c;

      if (disc < 0.0) {
        return -1.0;
      } else {
          return (-b - sqrt(disc) ) / (2.0*a);
          // return 1.0;
      }
    }

    // ########################## MAIN        ##########################
    
    vec3 ray_color(Ray r){
      float t = hit_sphere(vec3(0.0,0.0,-1.0), 0.5, r);
      if (t >= 0.0) {
          vec3 N = normalize(at(r, t) - vec3(0.0,0.0,-1.0));
          return 0.5 * vec3(N.x + 1.0, N.y + 1.0, N.z + 1.0);
      }

      vec3 dir = r.dir;
      t = 0.5 * (dir.y + 1.0);
      return (1.0 - t) * vec3(1.0) + t * vec3(0.5, 0.7, 1.0);
    }

    
    void main() {
      vec2 coord = gl_FragCoord.xy / iResolution.xy;
      float aspect_ratio = iResolution.x / iResolution.y;

      vec2 uv = 2.0 * coord - 1.0;
      uv.x *= aspect_ratio;
      
      vec3 origin = vec3(0.0);

      Ray r = Ray(origin, vec3(uv, depth) - origin);
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
  var mouse = gl.getUniformLocation(program, "iMouse");
  function render(deltaMS) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(resolution, [gl.canvas.width, gl.canvas.height, 0]);
    deltaMS /= datInput.renderSmoothen;
    gl.uniform1f(time, deltaMS);
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
}
