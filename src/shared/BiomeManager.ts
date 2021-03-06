import { AxialCoordinates, axialKey, calculateDecayingNoise, cubeDistance, getNearbyCoordinates } from "shared/HexUtil";
import type { MapConfigImpl } from "shared/WorldBuilder";

export enum Biome {
	Water,
	Grassland,
	Coastline,
	MountainSnow,
	Mountain,
}

function randomBiome(rand: Random) {
	const biomeObject = Object.values(Biome);

	const min = 3;
	let max = -1;

	biomeObject.forEach((value) => {
		if (typeOf(value) === "number") {
			max++;
		}
	});

	return rand.NextInteger(min, max) as Biome;
}

export class BiomeManager {
	private biomeCache = new Map<string, Biome>();

	public constructor(readonly config: MapConfigImpl, readonly rand: Random) {}

	public getTileBiome(axial: AxialCoordinates) {
		if (this.tileHasWater(axial)) {
			return Biome.Water;
		}

		if (this.tileIsCoastline(axial)) {
			return Biome.Coastline;
		}

		const height = calculateDecayingNoise(axial, this.config);
		if (height > 0.2) {
			return Biome.MountainSnow;
		} else if (height > 0) {
			return Biome.Mountain;
		}

		return Biome.Grassland;

		// if (!this.tileHasSpecialBiome(axial)) {
		// 	return Biome.Grassland;
		// }

		// const cachedBiome = this.biomeCache.get(axialKey(axial));
		// if (cachedBiome !== undefined) {
		// 	return cachedBiome;
		// }

		// const newBiome = this.createBiomeFromSeed(axial);

		// return newBiome;
	}

	private tileIsCoastline(axial: AxialCoordinates) {
		for (const neighbor of getNearbyCoordinates(axial, 1)) {
			if (this.tileHasWater(neighbor)) {
				return true;
			}
		}

		return false;
	}

	private tileHasWater(axial: AxialCoordinates) {
		const height = calculateDecayingNoise(axial, this.config);
		if (height <= this.config.WaterLevel) {
			return true;
		}

		return false;
	}

	private tileHasSpecialBiome(axial: AxialCoordinates) {
		const biomeScore = math.noise(axial.X / 4, axial.Z / 4, this.config.Seed * 5) / 2 + 1;
		if (biomeScore < 0.95) {
			return true;
		}

		return false;
	}

	private createBiomeFromSeed(seed: AxialCoordinates) {
		const newBiome = randomBiome(this.rand);

		const biomeTiles = new Set<AxialCoordinates>();

		const visited = new Set<string>();
		const willVisit = new Set<string>();

		const toVisit: Array<AxialCoordinates> = [seed];

		let visitIndex = 0;
		for (;;) {
			const tile = toVisit[visitIndex];

			if (!tile) {
				break;
			}

			if (visited.has(axialKey(tile))) {
				visitIndex++;
				continue;
			}

			visited.add(axialKey(tile));

			if (this.tileHasSpecialBiome(tile)) {
				biomeTiles.add(tile);

				getNearbyCoordinates(tile, 1).forEach((neighbor) => {
					if (!willVisit.has(axialKey(neighbor)) && cubeDistance(neighbor) <= this.config.Radius) {
						toVisit.push(neighbor);
						willVisit.add(axialKey(neighbor));
					}
				});
			}

			visitIndex++;
		}

		biomeTiles.forEach((tile) => {
			this.biomeCache.set(axialKey(tile), newBiome);
		});

		return newBiome;
	}
}
