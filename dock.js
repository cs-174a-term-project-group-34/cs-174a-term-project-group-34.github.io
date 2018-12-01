window.Dock = window.classes.Dock =
class Dock extends Entity
  { constructor( context, control_box, shadow_map ){
        super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        var circ = [];
        for (var i = 0; i < 10; i++){
            circ.push(Vec.of(0,(Math.cos(Math.PI*i/5)+3)/10,Math.sin(Math.PI*i/5)/10));
        }
        circ.push(circ[0]);
        const shapes = {'box': new Cube(),
                        'ball': new Subdivision_Sphere(4),
                        'cylinder': new Surface_Of_Revolution(3,20, [Vec.of(0,0,1),Vec.of(0,1,1),Vec.of(0,1,-1),Vec.of(0,0,-1)], [ [ 0, 1 ], [ 0,20 ] ]),
                        'ring': new Surface_Of_Revolution(20,20, circ, [ [ 0, 20 ], [ 0,20 ] ]),             // At the beginning of our program, load one of each of these shape
                        }      // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                        // the one called "box" more than once in display() to draw
                                                        // multiple cubes.  Don't define more than one blueprint for the
                                                        // same thing here.

                                   // Make some Material objects available to you:
        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( 0,0,0, 1 ), { ambient: 0.2, diffusivity: 1, specularity: 0, texture: context.get_instance( "assets/wood.jpg", true ) } );
        let model_transform = Mat4.identity();
        this.model_transform = model_transform.times(Mat4.translation([-155,-50,60])).times(Mat4.rotation(Math.PI/2,Vec.of(0,1,0)));
        this.water = context.get_instance( Water_Shader ).material(Color.of( 0, 0, 0, 0.5), { ambient: 0.2, specularity: 1.0, diffusivity: 1.0, reflectivity: 0.85, texture: context.get_instance( "assets/water.jpg", true ), shadow_map: shadow_map, envmap: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ), bump_map: context.get_instance("assets/water_bumpmap.jpg", true) }     );
        this.splashes = [];
        this.splash_time = [];
        this.delay = 0;

    }
    check_bite(power, dir){
        const splash_radius_check = 0.08
        // const splash_radius_check = 10
        dir = Mat4.rotation(-Math.PI/2,Vec.of(0,1,0)).times(Vec.of(dir[0],dir[1],dir[2],1));
        power = (power - 2.85) * 2 + 8;
        console.log(power);
        console.log(dir);
        for (var splash of this.splashes){
            var splash_dir = Mat4.rotation(Math.PI/32*splash[1],Vec.of(0,1,0)).times(Vec.of(0,0,1,1));
            console.log(splash_dir);
            console.log(splash[0]);
            if(Math.abs(power - splash[0]) < 1 && Math.abs(dir[0] - splash_dir[0] + dir[2] - splash_dir[2]) < splash_radius_check){
                return true;
            }
        }
        return false;
    }
    update(graphics_state){
        var t = graphics_state.animation_delta_time;
        this.delay -= t;
        if(this.delay <= 0){
            this.delay = 2000;
            this.splashes.push([Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 9) - 4]);
            this.splash_time.push(0);
        }
        for(var i = this.splashes.length - 1; i >= 0 ; i--){
            this.splash_time[i] += t/300;
            if (this.splash_time[i] > 33){
                this.splash_time.shift();
                this.splashes.shift();
                i--;
            }
        }
    }
    draw(graphics_state, material_override){
        let model_transform = this.model_transform;//[2.5,0.05,5]
        this.shapes.box.draw(graphics_state, model_transform.times(Mat4.scale([2.5,0.05,5])), this.get_material(this.clay, material_override));
        this.shapes.cylinder.draw(graphics_state, model_transform.times(Mat4.translation([2.5,-1.3,5])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))).times(Mat4.scale([0.25,0.25,2])), this.get_material(this.clay, material_override));
        this.shapes.cylinder.draw(graphics_state, model_transform.times(Mat4.translation([-2.5,-1.3,5])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))).times(Mat4.scale([0.25,0.25,2])), this.get_material(this.clay, material_override));
        for(var i = this.splashes.length - 1; i >= 0 ; i--){
                if (this.splash_time[i] > 3.5*Math.PI)
                    continue;
                var model_transform_ring = Mat4.identity().times(Mat4.translation([-152.5,-50,60])).times(Mat4.rotation(Math.PI/2,Vec.of(0,1,0))).times(Mat4.rotation(Math.PI/32*this.splashes[i][1],Vec.of(0,1,0))).times(Mat4.translation([0,0,this.splashes[i][0]]));
                this.shapes.ring.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.sin(this.splash_time[i]),0])).times(Mat4.scale([1,0.75,1])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
                this.shapes.ring.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.sin(this.splash_time[i]+Math.PI/4),0])).times(Mat4.scale([0.75,0.75,0.75])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
                this.shapes.ball.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.cos(this.splash_time[i]),0])).times(Mat4.scale([0.2,0.1,0.2])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
        }
        // for(var i = 8; i < 16; i++){
        //     for(var j = -4; j < 5; j++){
        //         var model_transform_ring = Mat4.identity().times(Mat4.translation([-152.5,-50,60])).times(Mat4.rotation(Math.PI/2,Vec.of(0,1,0))).times(Mat4.rotation(Math.PI/32*j,Vec.of(0,1,0))).times(Mat4.translation([0,0,i]));
        //         this.shapes.ring.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.sin(graphics_state.animation_time/200),0])).times(Mat4.scale([1,0.75,1])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
        //         this.shapes.ring.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.sin(graphics_state.animation_time/200+Math.PI/4),0])).times(Mat4.scale([0.75,0.75,0.75])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
        //         this.shapes.ball.draw(graphics_state, model_transform_ring.times(Mat4.translation([0,-0.56+ 0.1*Math.cos(graphics_state.animation_time/200),0])).times(Mat4.scale([0.2,0.1,0.2])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))), this.get_material(this.water, material_override));
        //     }
        // }
    }

}
