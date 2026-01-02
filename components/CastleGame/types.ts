export interface BuildingType {
    id: string;
    name: string;
    type: 'defense' | 'economy' | 'decoration' | 'military';
    width: number; // grid units
    height: number; // grid units
    cost: number;
    emoji: string;
    description: string;
    productionRate?: number; // per hour
}

export interface PlacedBuilding {
    id: string;
    buildingId: string;
    x: number;
    y: number;
    level: number;
    createdAt: number;
}

export interface GridTile {
    x: number;
    y: number;
    occupied: boolean;
}
