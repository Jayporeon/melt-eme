// GLSL for the three fullscreen stages: background, composite (text + melt/wobble/glitch), post.
export const COMMON = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes;
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
vec2 h22(vec2 p){ vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); q+=dot(q,q.yzx+33.33); return fract((q.xx+q.yz)*q.zy); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=.5; } return s; }
vec3 srgb2lin(vec3 c){ return pow(c, vec3(2.2)); }
`;

// Background modes
//  0 night room: dark navy, monitor light from the left, dust
//  1 liquid: sky-blue water, caustics, rising bubbles
//  2 film: soap-film iridescence over dark
//  3 tiles: cold bathroom floor in perspective
//  4 ceiling: ceiling panels and a round lamp seen from below
//  5 pop: beat stripes of sky / white / lilac
//  6 black
export const BG = COMMON + `
uniform float uT, uMode, uMode2, uMix, uBeat, uKick, uBass, uA, uB, uC, uLight;
uniform vec3 uTint;
vec3 night(vec2 uv, vec2 p){
  vec3 c = vec3(.012,.022,.045);
  // screen light from the left-bottom, and a phone glow at the bottom right
  float m = exp(-length((p-vec2(-1.15,-.35))*vec2(.9,1.3))*1.6);
  float ph = exp(-length((p-vec2(.95,-.75))*vec2(1.2,1.0))*3.2);
  float flick = .92 + .08*vn(vec2(uT*3.1, 1.));
  c += vec3(.05,.16,.32)*m*flick*uLight + vec3(.08,.18,.30)*ph*.55*uLight;
  // dust motes
  for(int i=0;i<3;i++){
    float fi=float(i);
    vec2 q = p*vec2(9.+fi*5.) + vec2(uT*.05*(fi+1.), -uT*.03*(1.+fi));
    vec2 g = floor(q), f = fract(q)-.5; vec2 r = h22(g)-.5;
    float d = length(f - r*.6);
    float on = step(.86, h21(g+fi*7.));
    c += vec3(.25,.5,.8) * on * smoothstep(.06,.0,d) * .07 * (m*2.+.2);
  }
  return c;
}
vec3 liquid(vec2 uv, vec2 p){
  float depth = uv.y;
  vec3 deep = vec3(.01,.08,.26), top = vec3(.10,.42,.80);
  vec3 c = mix(deep, top, smoothstep(-.1,1.1,depth));
  // caustics
  vec2 q = p*2.2 + vec2(0., uT*.15);
  float cs = 0.;
  vec2 i = q;
  float s = 0.;
  for(int n=0;n<4;n++){
    float t = uT*.35*(1.-3.5/float(n+1));
    i = q + vec2(cos(t-i.x)+sin(t+i.y), sin(t-i.y)+cos(t+i.x));
    s += 1./length(vec2(q.x/(sin(i.x+t)/.006), q.y/(cos(i.y+t)/.006)));
  }
  s /= 4.;
  cs = pow(clamp(1.17-pow(s,1.4),0.,1.),8.);
  c += vec3(.45,.8,1.)*cs*(.12+.22*depth)*(1.+uBass*.6);
  // god rays
  float ray = fbm(vec2(p.x*3. + p.y*.8, uT*.2));
  c += vec3(.3,.7,1.)*pow(ray,3.)*.14*depth;
  // bubbles rising
  for(int k=0;k<2;k++){
    float fk=float(k);
    vec2 g = p*vec2(5.+fk*4.) ; g.y -= uT*(.35+fk*.25);
    vec2 id = floor(g); vec2 f = fract(g)-.5;
    vec2 r = h22(id+fk*11.);
    if(r.x>.82){
      f.x += sin(uT*2.+id.y)*.12;
      float rad = .07+.12*r.y;
      float d = length(f-(r-.5)*.4);
      float ring = smoothstep(rad,rad-.025,d)-smoothstep(rad-.03,rad-.06,d);
      float hl = smoothstep(.04,.0,length(f-(r-.5)*.4+vec2(rad*.4,-rad*.4)));
      c += vec3(.7,.9,1.)*(ring*.22+hl*.3);
    }
  }
  return c;
}
vec3 film(vec2 uv, vec2 p){
  float th = fbm(p*1.3 + vec2(uT*.05, -uT*.07)) + .35*fbm(p*3.1 - uT*.1);
  th = th*2.2 + uA;
  // thin film interference: shifted cosines
  vec3 irid = .5 + .5*cos(6.2831*(th*vec3(1.,1.08,1.17) + vec3(0.,.33,.67)));
  float sw = smoothstep(.2,.9,fbm(p*.9+uT*.03));
  vec3 base = vec3(.02,.04,.08);
  return base + irid*vec3(.35,.55,.75)*(.14+.3*sw) + vec3(.1,.25,.4)*.08;
}
vec3 tiles(vec2 uv, vec2 p){
  // floor plane seen from low angle
  float hor = .25;
  vec3 c = vec3(.02,.03,.04);
  if(p.y < hor){
    float z = 1./(hor - p.y + .02);
    vec2 w = vec2(p.x*z*.9 + uA, z*1.2 + uT*.05);
    vec2 g = fract(w*1.2);
    float line = min(min(g.x,1.-g.x), min(g.y,1.-g.y));
    float grout = smoothstep(.0,.04*z*.3+.02,line);
    vec3 tile = vec3(.36,.46,.52)*(.75+.25*h21(floor(w*1.2)));
    vec3 cc = mix(vec3(.05,.07,.08), tile, grout);
    float fog = exp(-z*.18);
    c = mix(c, cc, fog);
    c *= .25 + .9*exp(-length(p-vec2(.2,-.6))*1.2);
  } else {
    // wall: square tiles
    vec2 g = fract(p*vec2(3.5) + vec2(.0,.0));
    float line = min(min(g.x,1.-g.x), min(g.y,1.-g.y));
    c = mix(vec3(.04,.05,.06), vec3(.2,.26,.3), smoothstep(.0,.03,line))*.55;
    c *= .3 + .7*exp(-length(p-vec2(.3,.2))*1.);
  }
  return c * uLight;
}
vec3 ceiling(vec2 uv, vec2 p){
  vec3 c = vec3(.05,.06,.08);
  vec2 g = fract((p + vec2(uA,0.))*1.6);
  float line = min(min(g.x,1.-g.x), min(g.y,1.-g.y));
  c = mix(vec3(.03,.035,.05), c*1.4, smoothstep(.0,.012,line));
  float d = length(p - vec2(uB, uC));
  float ring = smoothstep(.015,.0,abs(d-.22)) * .9;
  float disc = smoothstep(.22,.2,d);
  float lamp = uLight;
  c += vec3(.75,.88,1.)*disc*.45*lamp + vec3(.8,.92,1.)*ring*.4*lamp;
  c += vec3(.2,.35,.55)*exp(-d*3.)*.35*lamp;
  return c;
}
vec3 pop(vec2 uv, vec2 p){
  float b = floor(uBeat);
  float ang = .5 + .25*sin(b*1.7);
  vec2 r = mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*p;
  float k = mod(b, 3.);
  float st = step(.5, fract(r.x*2.5 - uT*.6 + uBass*.15));
  vec3 a = vec3(.36,.80,1.), w = vec3(.93,.97,1.), l = vec3(.66,.55,1.);
  vec3 dp = vec3(.07,.27,.62);
  vec3 c1 = k<1. ? a : (k<2. ? dp : w);
  vec3 c2 = k<1. ? w : (k<2. ? a : (uA>.5 ? l*.95 : vec3(.18,.56,.91)));
  vec3 c = mix(c1, c2, st);
  // pill polka
  vec2 q = r*6. + vec2(uT*.4, 0.); vec2 id=floor(q); vec2 f=fract(q)-.5;
  float rot = h21(id)*3.14 + uT;
  f = mat2(cos(rot),-sin(rot),sin(rot),cos(rot))*f;
  vec2 e = vec2(max(abs(f.x)-.12,0.), f.y);
  float pill = smoothstep(.1,.08,length(e));
  c = mix(c, vec3(1.), pill*.85*step(.5,h21(id+3.)));
  return c*(.85+.25*uKick);
}
vec3 bgMode(float m, vec2 uv, vec2 p){
  if(m<.5) return night(uv,p);
  if(m<1.5) return liquid(uv,p);
  if(m<2.5) return film(uv,p);
  if(m<3.5) return tiles(uv,p);
  if(m<4.5) return ceiling(uv,p);
  if(m<5.5) return pop(uv,p);
  return vec3(0.);
}
void main(){
  vec2 uv = vUv;
  vec2 p = (uv-.5)*vec2(uRes.x/uRes.y,1.)*2.;
  vec3 c = bgMode(uMode, uv, p);
  if(uMix > 0.) c = mix(c, bgMode(uMode2, uv, p), uMix);
  c *= uTint;
  o = vec4(c,1.);
}`;

// Composite: background + ink layer (melts, wobbles, glitches) + sub layer (stable).
export const COMP = COMMON + `
uniform sampler2D uBg, uInk, uSub;
uniform float uT, uMelt, uMeltSeed, uWob, uWobF, uGlitch, uRgb, uFrame, uZoom, uRot, uRefr, uDouble;
uniform vec2 uShake, uDoubleOff;
vec2 cam(vec2 uv){
  vec2 a = vec2(uRes.x/uRes.y,1.);
  vec2 p = (uv-.5)*a;
  float c=cos(uRot), s=sin(uRot);
  p = mat2(c,-s,s,c)*p / uZoom;
  return p/a + .5 + uShake;
}
vec4 ink(vec2 uv){ return texture(uInk, uv); }
vec4 inkMelt(vec2 uv){
  vec4 c = ink(uv);
  if(uMelt <= 0.001) return c;
  // per column drip length: slow-varying noise, a few long drips
  float x = uv.x*uRes.x/uRes.y;
  float n = vn(vec2(x*28., uMeltSeed)) ;
  float n2 = vn(vec2(x*7., uMeltSeed+5.));
  float len = uMelt * (.012 + .16*pow(n,4.)*n2 + .03*n2);
  // the whole layer also sags a little
  vec2 suv = uv + vec2(0., uMelt*.012*n2);
  c = ink(suv);
  vec4 acc = c;
  for(int k=1;k<=14;k++){
    float f = float(k)/14.;
    vec4 s = ink(suv + vec2(0., len*f));
    float fall = (1.-f*f) ;
    acc = max(acc, s*fall);
  }
  // round the drip tips slightly with a softer fade
  return acc;
}
void main(){
  vec2 uv = vUv;
  // glitch: horizontal slices
  if(uGlitch>0.){
    float band = floor(uv.y*24. + h11(floor(uFrame/3.))*7.);
    float r = h21(vec2(band, floor(uFrame/2.)));
    if(r < uGlitch*.35) uv.x += (h21(vec2(band,uFrame))-.5)*.12*uGlitch;
  }
  // wobble (liquid)
  if(uWob>0.){
    uv += uWob*vec2(sin(uv.y*uWobF + uT*3.1)*.012 + sin(uv.y*uWobF*2.3 - uT*4.7)*.004,
                    sin(uv.x*uWobF*.8 + uT*2.3)*.010);
  }
  vec2 cu = cam(uv);
  vec3 bg = texture(uBg, cu + uRefr*vec2(sin(cu.y*30.+uT*2.),cos(cu.x*25.-uT*1.7))*.004).rgb;
  vec4 a;
  if(uRgb>0.){
    vec2 d = vec2(uRgb*.006,0.);
    vec4 r = inkMelt(cu+d), g = inkMelt(cu), b = inkMelt(cu-d);
    a = vec4(r.r, g.g, b.b, max(max(r.a,g.a),b.a));
  } else a = inkMelt(cu);
  if(uDouble>0.){
    vec4 g2 = inkMelt(cu + uDoubleOff);
    a = max(a, g2*uDouble*.55);
  }
  // ink is premultiplied sRGB; composite in sRGB then linearise for bloom
  vec3 col = bg*(1.-a.a) + a.rgb;
  vec4 s = texture(uSub, vUv); // subtitles stay still: no wobble, glitch or camera move
  col = col*(1.-s.a) + s.rgb;
  o = vec4(srgb2lin(max(col,0.)), 1.);
}`;

export const BRIGHT = COMMON + `
uniform sampler2D uSrc; uniform float uThr;
void main(){ vec3 c = texture(uSrc, vUv).rgb; float l = .5*max(max(c.r,c.g),c.b) + .75*dot(c, vec3(.2126,.7152,.0722));
  o = vec4(c*smoothstep(uThr, uThr+.35, l), 1.); }`;

// dual-filter (Kawase) down / up
export const DOWN = COMMON + `
uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){ vec2 h = uTexel*.5;
  vec3 s = texture(uSrc,vUv).rgb*4.;
  s += texture(uSrc,vUv-h).rgb + texture(uSrc,vUv+h).rgb + texture(uSrc,vUv+vec2(h.x,-h.y)).rgb + texture(uSrc,vUv-vec2(h.x,-h.y)).rgb;
  o = vec4(s/8.,1.); }`;
export const UP = COMMON + `
uniform sampler2D uSrc, uAdd; uniform vec2 uTexel;
void main(){ vec2 h = uTexel*.5;
  vec3 s = texture(uSrc,vUv+vec2(-h.x*2.,0.)).rgb + texture(uSrc,vUv+vec2(-h.x,h.y)).rgb*2. +
    texture(uSrc,vUv+vec2(0.,h.y*2.)).rgb + texture(uSrc,vUv+vec2(h.x,h.y)).rgb*2. +
    texture(uSrc,vUv+vec2(h.x*2.,0.)).rgb + texture(uSrc,vUv+vec2(h.x,-h.y)).rgb*2. +
    texture(uSrc,vUv+vec2(0.,-h.y*2.)).rgb + texture(uSrc,vUv+vec2(-h.x,-h.y)).rgb*2.;
  o = vec4(s/12. + texture(uAdd,vUv).rgb, 1.); }`;

export const FINAL = COMMON + `
uniform sampler2D uSrc, uBloom;
uniform float uT, uFrame, uBloomAmt, uCa, uGrain, uVig, uFlash, uInvert, uFade, uExpo, uSat;
uniform vec3 uFlashCol;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
void main(){
  vec2 uv = vUv;
  vec2 d = (uv-.5);
  float r2 = dot(d,d);
  vec3 c;
  if(uCa>0.){
    vec2 off = d*r2*uCa*0.012;
    c = vec3(texture(uSrc, uv-off).r, texture(uSrc, uv).g, texture(uSrc, uv+off).b);
  } else c = texture(uSrc, uv).rgb;
  c += texture(uBloom, uv).rgb * uBloomAmt;
  c *= uExpo;
  // gentle shoulder: keep mids linear-ish, roll highlights
  c = mix(c, aces(c*1.1), .35);
  c = pow(max(c,0.), vec3(1./2.2));
  float l = dot(c, vec3(.299,.587,.114));
  c = mix(vec3(l), c, uSat);
  c = mix(c, uFlashCol, uFlash);
  c = mix(c, 1.-c, uInvert);
  c *= 1. - uVig*smoothstep(.15,.85,r2*2.2);
  // grain: luminance-weighted, changes every frame
  float g = h21(uv*uRes + fract(uFrame*.6180339)*917.) - .5;
  g += h21(uv*uRes*.5 + 33. + uFrame) - .5;
  c += g*uGrain*(.35 + .65*(1.-l));
  c *= 1.-uFade;
  o = vec4(clamp(c,0.,1.),1.);
}`;
