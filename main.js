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
    #define MAXSTEPS 35
    #define z_near 0.00125
    #define R 1.0
    #define Iterations 32 
    #define Scale 2.0
    // ########################### STRUCTS #############################

    
    struct Ray {
      vec3 pos;
      vec3 dir;
    };

    struct Sphere {
      vec3 cen;
      float r;
    };

    struct Hittable {
      float t;
      vec3 p;
      vec3 normal;
    };

    // ########################## HELPERS     ##########################

    vec3 at(Ray r, float t) {
      return r.pos + r.dir * t;
    }

    bool hit_sphere(Sphere s, Ray r, float t_min, float t_max, inout Hittable h) {
      float radius = s.r;
      vec3 center = s.cen;

      vec3 oc = r.pos - center;
      float a = dot(r.dir, r.dir);
      float b = 2.0 * dot(oc, r.dir);
      float c = dot(oc, oc) - radius * radius;
      float disc = b * b - 4.0 * a * c;

      if (disc < 0.0) {
        return false;
      }
      float root1 = (-b - sqrt(disc) ) / (2.0*a);
      float root2 = (-b + sqrt(disc) ) / (2.0*a);

      if (t_min <= root1 && root1 <= t_max) {
        h.t = root1;
        h.p = at(r, root1);
        h.normal = (h.p - center) / radius;
        return true;
      }
      else if (t_min <= root2 && root2 <= t_max) {
        h.t = root2;
        h.p = at(r, root2);
        h.normal = (h.p - center) / radius;
        return true;
      }
      
      return false;
    }

    // ########################## MAIN        ##########################

    float DE(vec3 z) {
      vec3 a1 = vec3(1,1,1);
      vec3 a2 = vec3(-1,-1,1);
      vec3 a3 = vec3(1,-1,-1);
      vec3 a4 = vec3(-1,1,-1);
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
