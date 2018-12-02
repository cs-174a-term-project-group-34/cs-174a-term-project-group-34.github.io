window.ReelGame = window.classes.ReelGame =
class ReelGame{
    constructor(level){
        this.fish_pos = 50;
        this.fish_dir = 1;
        this.fish_speed = 1/40;
        this.fish_level = level;
        this.range_width = 20;
        this.range_pos = 50 - this.range_width/2;
        this.range_decay = 1/20;
        this.progress = 20;
        this.elapsed_time = 0;
        this.state = 0;
        this.progress_speed = 1/100;
        this.fail_speed = 0.004 + 0.001/5.0 * this.fish_level;
        if (this.fish_level < 3) {
            this.progress_speed = 1/50
        }
        if (this.fish_level < 5) {
            this.fish_speed = 1/40 - .005
        } else if (this.fish_level > 7) {
            this.fish_speed = 1/40 + .005
        }
        // console.log(this.fish_level)
    }

    update(time_delta){
        if(this.state)
            return;

        //Update range bar
        this.range_pos -= time_delta * this.range_decay;
        this.range_pos = Math.max(this.range_pos,0);

        //Move fish randomly
        this.elapsed_time += time_delta;
        if(this.elapsed_time > 250){
            this.elapsed_time = 0;
            if(Math.random() > 0.75){
                this.fish_dir -= 2*this.fish_dir;
            }
        }
        //Update fish position
        this.fish_pos += this.fish_dir*this.fish_speed*time_delta;
        if(this.fish_pos < 0){
            this.fish_dir = 1;
        }
        if(this.fish_pos > 100){
            this.fish_dir = -1;
        }
        this.fish_pos = Math.min(Math.max(this.fish_pos,0),100);

        //Update progress bard
        if(this.fish_pos < this.range_pos || this.fish_pos > this.range_pos + this.range_width){
            this.progress -= time_delta*this.fail_speed;
        }else{
            this.progress += time_delta*this.progress_speed;
        }

        //Check win/loss conditions
        if(this.progress < 0){
            this.state = -1;
        }else if(this.progress >= 100){
            this.state = 1;
        }
    }
    // draw(){
    //     var s = "";
    //     for (var i = 0; i < 100; i++){
    //         if(i == Math.floor(this.fish_pos)){
    //             s += "0";
    //         }
    //         if(i == Math.floor(this.range_pos) || i == Math.floor(this.range_pos+this.range_width)){
    //             s += "|";
    //         }else {
    //             s += ".";
    //         }
    //     }
    //     console.log(s);
    //     console.log(this.progress);
    // }
    reel(){
        this.range_pos += 15;
        this.range_pos = Math.min(this.range_pos, 100-this.range_width);
    }
    getProgress(){
        return this.progress;
    }
    getStatus(){
        return this.state;
    }
}
