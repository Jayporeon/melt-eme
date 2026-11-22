// Minimal WebGL2: fullscreen passes, float targets, canvas textures.
export type U = number | [number, number] | [number, number, number] | [number, number, number, number] | Tex;

export interface Tex {
  tex: WebGLTexture;
  w: number;
  h: number;
}
export interface Target extends Tex {
  fb: WebGLFramebuffer;
}

const VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

export class GL {
  gl: WebGL2RenderingContext;
  private buf: WebGLBuffer;
  private progs = new Map<string, { p: WebGLProgram; loc: Map<string, WebGLUniformLocation | null> }>();
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('no webgl2');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no float targets');
    gl.getExtension('OES_texture_float_linear');
    this.gl = gl;
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }
  program(name: string, fs: string) {
    const got = this.progs.get(name);
    if (got) return got;
    const gl = this.gl;
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        const numbered = src
          .split('\n')
          .map((l, i) => `${i + 1}: ${l}`)
          .join('\n');
        console.error(numbered);
        throw new Error(`shader ${name}: ${log}`);
      }
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link ${name}: ${gl.getProgramInfoLog(p)}`);
    const r = { p, loc: new Map<string, WebGLUniformLocation | null>() };
    this.progs.set(name, r);
    return r;
  }
  target(w: number, h: number, float = true): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    this.params();
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fb, w, h };
  }
  private params() {
    const gl = this.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  canvasTex(): Tex {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    this.params();
    return { tex, w: 0, h: 0 };
  }
  upload(t: Tex, c: HTMLCanvasElement | OffscreenCanvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c as TexImageSource);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    t.w = c.width;
    t.h = c.height;
  }
  draw(name: string, fs: string, to: Target | null, u: Record<string, U>) {
    const gl = this.gl;
    const pr = this.program(name, fs);
    gl.useProgram(pr.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fb : null);
    const w = to ? to.w : this.canvas.width;
    const h = to ? to.h : this.canvas.height;
    gl.viewport(0, 0, w, h);
    let unit = 0;
    const loc = (n: string) => {
      if (!pr.loc.has(n)) pr.loc.set(n, gl.getUniformLocation(pr.p, n));
      return pr.loc.get(n)!;
    };
    gl.uniform2f(loc('uRes'), w, h);
    for (const k in u) {
      const v = u[k];
      const l = loc(k);
      if (l === null) continue;
      if (typeof v === 'number') gl.uniform1f(l, v);
      else if (Array.isArray(v)) {
        if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
        else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
        else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
      } else {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v.tex);
        gl.uniform1i(l, unit++);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
