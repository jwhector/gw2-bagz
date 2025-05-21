/* eslint-disable no-var */
// Label placement algorithm using simulated annealing
interface Label {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
}

interface Anchor {
  x: number;
  y: number;
  r: number;
}

export class Labeler {
  private lab: Label[];
  private anc: Anchor[];
  private w: number;
  private h: number;
  private max_move: number;
  private max_angle: number;
  private acc: number;
  private rej: number;
  private w_len: number;
  private w_inter: number;
  private w_lab2: number;
  private w_lab_anc: number;
  private w_orient: number;
  private user_energy: boolean;
  private user_schedule: boolean;
  private user_defined_energy:
    | ((index: number, lab: Label[], anc: Anchor[]) => number)
    | null;
  private user_defined_schedule:
    | ((currT: number, initialT: number, nsweeps: number) => number)
    | null;

  constructor() {
    this.lab = [];
    this.anc = [];
    this.w = 1; // box width
    this.h = 1; // box height
    this.max_move = 5.0;
    this.max_angle = 0.5;
    this.acc = 0;
    this.rej = 0;

    // weights
    this.w_len = 0.2; // leader line length
    this.w_inter = 1.0; // leader line intersection
    this.w_lab2 = 30.0; // label-label overlap
    this.w_lab_anc = 30.0; // label-anchor overlap
    this.w_orient = 3.0; // orientation bias

    // booleans for user defined functions
    this.user_energy = false;
    this.user_schedule = false;
    this.user_defined_energy = null;
    this.user_defined_schedule = null;
  }

  energy(index: number): number {
    // energy function, tailored for label placement
    var m = this.lab.length,
      ener = 0,
      dx = this.lab[index].x - this.anc[index].x,
      dy = this.anc[index].y - this.lab[index].y,
      dist = Math.sqrt(dx * dx + dy * dy),
      overlap = true;

    // penalty for length of leader line
    if (dist > 0) ener += dist * this.w_len;

    // label orientation bias
    dx /= dist;
    dy /= dist;
    if (dx > 0 && dy > 0) {
      ener += 0 * this.w_orient;
    } else if (dx < 0 && dy > 0) {
      ener += 1 * this.w_orient;
    } else if (dx < 0 && dy < 0) {
      ener += 2 * this.w_orient;
    } else {
      ener += 3 * this.w_orient;
    }

    var x21 = this.lab[index].x,
      y21 = this.lab[index].y - this.lab[index].height + 2.0,
      x22 = this.lab[index].x + this.lab[index].width,
      y22 = this.lab[index].y + 2.0;
    var x11, x12, y11, y12, x_overlap, y_overlap, overlap_area;

    for (var i = 0; i < m; i++) {
      if (i != index) {
        // penalty for intersection of leader lines
        overlap = this.intersect(
          this.anc[index].x,
          this.lab[index].x,
          this.anc[i].x,
          this.lab[i].x,
          this.anc[index].y,
          this.lab[index].y,
          this.anc[i].y,
          this.lab[i].y
        );
        if (overlap) ener += this.w_inter;

        // penalty for label-label overlap
        x11 = this.lab[i].x;
        y11 = this.lab[i].y - this.lab[i].height + 2.0;
        x12 = this.lab[i].x + this.lab[i].width;
        y12 = this.lab[i].y + 2.0;
        x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
        y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
        overlap_area = x_overlap * y_overlap;
        ener += overlap_area * this.w_lab2;
      }

      // penalty for label-anchor overlap
      x11 = this.anc[i].x - this.anc[i].r;
      y11 = this.anc[i].y - this.anc[i].r;
      x12 = this.anc[i].x + this.anc[i].r;
      y12 = this.anc[i].y + this.anc[i].r;
      x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
      y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
      overlap_area = x_overlap * y_overlap;
      ener += overlap_area * this.w_lab_anc;
    }
    return ener;
  }

  mcmove(currT: number): void {
    // Monte Carlo translation move
    var i = Math.floor(Math.random() * this.lab.length);
    var x_old = this.lab[i].x;
    var y_old = this.lab[i].y;

    var old_energy = this.user_energy
      ? this.user_defined_energy!(i, this.lab, this.anc)
      : this.energy(i);

    this.lab[i].x += (Math.random() - 0.5) * this.max_move;
    this.lab[i].y += (Math.random() - 0.5) * this.max_move;

    // hard wall boundaries
    if (this.lab[i].x > this.w) this.lab[i].x = x_old;
    if (this.lab[i].x < 0) this.lab[i].x = x_old;
    if (this.lab[i].y > this.h) this.lab[i].y = y_old;
    if (this.lab[i].y < 0) this.lab[i].y = y_old;

    var new_energy = this.user_energy
      ? this.user_defined_energy!(i, this.lab, this.anc)
      : this.energy(i);
    var delta_energy = new_energy - old_energy;

    if (Math.random() < Math.exp(-delta_energy / currT)) {
      this.acc += 1;
    } else {
      this.lab[i].x = x_old;
      this.lab[i].y = y_old;
      this.rej += 1;
    }
  }

  mcrotate(currT: number): void {
    // Monte Carlo rotation move
    var i = Math.floor(Math.random() * this.lab.length);
    var x_old = this.lab[i].x;
    var y_old = this.lab[i].y;

    var old_energy = this.user_energy
      ? this.user_defined_energy!(i, this.lab, this.anc)
      : this.energy(i);

    var angle = (Math.random() - 0.5) * this.max_angle;
    var s = Math.sin(angle);
    var c = Math.cos(angle);

    // translate label (relative to anchor at origin):
    this.lab[i].x -= this.anc[i].x;
    this.lab[i].y -= this.anc[i].y;

    // rotate label
    var x_new = this.lab[i].x * c - this.lab[i].y * s;
    var y_new = this.lab[i].x * s + this.lab[i].y * c;

    // translate label back
    this.lab[i].x = x_new + this.anc[i].x;
    this.lab[i].y = y_new + this.anc[i].y;

    // hard wall boundaries
    if (this.lab[i].x > this.w) this.lab[i].x = x_old;
    if (this.lab[i].x < 0) this.lab[i].x = x_old;
    if (this.lab[i].y > this.h) this.lab[i].y = y_old;
    if (this.lab[i].y < 0) this.lab[i].y = y_old;

    var new_energy = this.user_energy
      ? this.user_defined_energy!(i, this.lab, this.anc)
      : this.energy(i);
    var delta_energy = new_energy - old_energy;

    if (Math.random() < Math.exp(-delta_energy / currT)) {
      this.acc += 1;
    } else {
      this.lab[i].x = x_old;
      this.lab[i].y = y_old;
      this.rej += 1;
    }
  }

  intersect(
    x1: number,
    x2: number,
    x3: number,
    x4: number,
    y1: number,
    y2: number,
    y3: number,
    y4: number
  ): boolean {
    // returns true if two lines intersect, else false
    var mua, mub;
    var denom, numera, numerb;

    denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    mua = numera / denom;
    mub = numerb / denom;
    if (!(mua < 0 || mua > 1 || mub < 0 || mub > 1)) {
      return true;
    }
    return false;
  }

  cooling_schedule(currT: number, initialT: number, nsweeps: number): number {
    // linear cooling
    return currT - initialT / nsweeps;
  }

  start(nsweeps: number): void {
    // main simulated annealing function
    var m = this.lab.length,
      currT = 1.0,
      initialT = 1.0;

    for (var i = 0; i < nsweeps; i++) {
      for (var j = 0; j < m; j++) {
        if (Math.random() < 0.5) {
          this.mcmove(currT);
        } else {
          this.mcrotate(currT);
        }
      }
      currT = this.cooling_schedule(currT, initialT, nsweeps);
    }
  }

  width(x?: number): this {
    if (!arguments.length) return this;
    this.w = x!;
    return this;
  }

  height(x?: number): this {
    if (!arguments.length) return this;
    this.h = x!;
    return this;
  }

  label(x?: Label[]): this {
    if (!arguments.length) return this;
    this.lab = x!;
    return this;
  }

  anchor(x?: Anchor[]): this {
    if (!arguments.length) return this;
    this.anc = x!;
    return this;
  }

  alt_energy(
    x?: (index: number, lab: Label[], anc: Anchor[]) => number
  ): this {
    if (!arguments.length) return this;
    this.user_defined_energy = x!;
    this.user_energy = true;
    return this;
  }

  alt_schedule(
    x?: (currT: number, initialT: number, nsweeps: number) => number
  ): this {
    if (!arguments.length) return this;
    this.user_defined_schedule = x!;
    this.user_schedule = true;
    return this;
  }
}
