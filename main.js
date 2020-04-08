const canvas = document.getElementById('canvas');

class ScalingSystem {
	constructor() {
		this.pxInM = bigInt(149597870700 / 100); // 1 AE is 100 px 
		this.fps = 30;
		this.simSecsInRealSec = 31556926 / 20; // 1 year should be 20 sec in simultaion
		this.realSecPerFrame =  this.simSecsInRealSec / this.fps;
		this.simMassInRealMass = 1.989 * Math.pow(10, 30); // one sim mass = sun mass
		this.gravityConstant = bigInt(6.674 * Math.pow(10, 11));
		this.massToSizeFactor = 3000; 
	}

	convSimMassToRealMass(simulatedMass) {
		return simulatedMass * this.simMassInRealMass;
	}

	convMassToSize(mass) {
		return Math.cbrt(mass* this.massToSizeFactor) + 5 ;
	}

	convPxToM(px) {
		return this.pxInM.multiply(px);
	}

}

class Simulator {
	constructor(scalingSystem, elementId, width, height) {
		this.scaler = scalingSystem,
		this.canvasElement = document.getElementById(elementId),
		
		this.ctx = this.canvasElement.getContext('2d');
		this.canvasElement.width = width;
		this.canvasElement.height = height;


		this.objects = [];	
		
		this.simulationStart = null
		this.timeElapsed = null;
		this.simulationRunning = true;
	}

	frameAction() {
		this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
		// draw objects
		this.objects.forEach((object) => {
			object.getAllXVectors(this.scaler, this.objects);
			object.getAllYVectors(this.scaler, this.objects);
			object.calculateNewVectors();
			object.calculateNewPosition(this.scaler.realSecPerFrame);
			if (!object.checkOutOfBoundsX(this.canvasElement.width) && !object.checkOutOfBoundsY(this.canvasElement.height)){
				object.draw(this.ctx, this.scaler);
			}
		});
	}

	loop() {
		simulator.frameAction();
		if (simulator.simulationRunning) {
			window.requestAnimationFrame(simulator.loop);
		}
	}

	init() {
		this.loop();
	}

	// calculations

	// setter en getters

	setObjects(objectArray) {
		this.objects = objectArray;
	}

	addObject(object) {
		this.objects.push(object);
	}

	removeObject(index) {
		this.objects.splice(index, 1)
	}

	getObjects() {
		return this.objects;
	}
}

class SpaceObject {
	constructor(mass, posX, posY, initVectorX, initVectorY, name = 'unknown object') {
		this.mass = mass,
		this.posX = posX,
		this.posY = posY,
		this.initVectorX = initVectorX;
		this.initVectorY = initVectorY;
		this.name = name;
		
		this.vectorX = undefined;
		this.vectorY = undefined;
		this.externalXVectors = [];
		this.externalYVectors = [];
	}

	draw(ctx, scaler) {
		const radius = scaler.convMassToSize(this.mass) / 4;
		ctx.beginPath();
		ctx.arc(
			this.posX - (radius), this.posY - (radius),
			scaler.convMassToSize(this.mass),
			0, 2 * Math.PI);
		ctx.stroke();
	}

	getAllXVectors(scaler, objects) {
		// Fx = (G * m1 * m2) / math.pow(xr, 2)
		objects.forEach((object) => {
			const d = scaler.convPxToM(Math.ceil(this.posX - object.posX));
			if (!d.isZero()) {
				const sign = (d.greater(0)) ? -1 : 1;
				this.externalXVectors.push(
					((scaler.gravityConstant.multiply(scaler.convSimMassToRealMass(this.mass * object.mass))) / d.pow(2)) * sign
				);
			}
		});
	}

	getAllYVectors(scaler, objects) {
		// Fx = (G * m1 * m2) / math.pow(xr, 2)
		objects.forEach((object) => {
			const d = scaler.convPxToM(Math.ceil(this.posY - object.posY));
			if (d.pow(2).greater(1)  && this.name === 'aarde') {
				const sign = (d.greater(1)) ? -1 : 1;
				console.log(this.vectorY, (scaler.gravityConstant.multiply(scaler.convSimMassToRealMass(this.mass * object.mass)) / d.pow(2)) * sign);
				this.externalYVectors.push(
					(scaler.gravityConstant.multiply(scaler.convSimMassToRealMass(this.mass * object.mass)) / d.pow(2)) * sign
				);
			}
		});
	}

	calculateNewVectors() {
		let totalXVector = this.vectorX || this.initVectorX;
		let totalYVector = this.vectorY || this.initVectorY;
		this.externalXVectors.forEach((vector) => totalXVector += vector);
		this.externalYVectors.forEach((vector) => totalYVector += vector);
		this.vectorX = totalXVector;
		this.vectorY = totalYVector;
	}

	calculateNewPosition(time) {
		// a = F/m
		// deltaX = 0.5 * a * pow(t, 2)
		// deltaX = 0.5 * (F / m) * pow(t,2) 
		const deltaX = 0.5 * (this.vectorX / scaler.convSimMassToRealMass(this.mass)) * Math.pow(time, 2);
		const deltaY = 0.5 * (this.vectorY / scaler.convSimMassToRealMass(this.mass)) * Math.pow(time, 2);
		this.posX += deltaX;
		this.posY += deltaY;
		this.externalXVectors = [];
		this.externalYVectors = [];
	}

	checkOutOfBoundsX(canvasWidth) {
		return canvasWidth < this.posX || this.posX < 0;
	}

	checkOutOfBoundsY(canvasHeight) {
		return canvasHeight < this.posY || this.posY < 0;
	}
}

const scaler = new ScalingSystem();
const simulator = new Simulator(scaler, 'canvas', window.innerWidth, window.innerHeight);

simulator.setObjects([
	new SpaceObject(0.000003003, 400, 500, 0, 0, 'aarde'),
	new SpaceObject(1, 400, 300, 0, 0, 'zon'),
]);


simulator.init();