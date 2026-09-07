export function progressForScroll(y:number, start:number, travel:number) {
 return travel > 0 ? Math.max(0, Math.min(1, (y-start)/travel)) : 0;
}
export function timeForProgress(progress:number, duration:number, fps=24) {
 return Math.max(0, Math.min(Math.max(0,duration-1/fps), Math.max(0,progress)*duration));
}
export function sceneForTime(time:number, scenes:ReadonlyArray<{start:number;end:number}>, transition:number) {
 let index=0;
 for(let i=1;i<scenes.length;i++) if(time>=scenes[i]!.start+transition/2)index=i;
 return index;
}
export function scrollForTime(time:number, duration:number, start:number, travel:number) {
 return start+(duration>0 ? Math.max(0,Math.min(1,time/duration)):0)*travel;
}
interface Seekable {currentTime:number;seeking:boolean;readyState:number}
export class LatestSeek {
 private target=0;
 private disposed=false;
 constructor(private media:Seekable, private write=(time:number)=>{media.currentTime=time;}) {}
 request(time:number) {if(this.disposed)return;this.target=time;this.flush();}
 flush() {
  if(this.disposed || this.media.readyState<2 || this.media.seeking)return;
  if(Math.abs(this.media.currentTime-this.target)>1/48)this.write(this.target);
 }
 dispose(){this.disposed=true;}
}
