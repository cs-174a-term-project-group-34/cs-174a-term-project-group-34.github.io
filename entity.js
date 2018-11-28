window.Entity = window.classes.Entity =
class Entity extends Scene_Component {
    constructor(context, control_box) {
	super(context, control_box);
	this.material = undefined;
	this.geometry = undefined;
    }

    get_material(material_override) { return material_override ? material_override : this.material }

    update (graphics_state) {} draw (graphics_state, material_override) {}
}
