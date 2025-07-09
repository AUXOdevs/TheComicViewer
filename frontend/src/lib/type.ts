// types.ts
export type Titulo = {
  id: number;
  nombre: string;
  descripcion: string;
  autor: string;
  genero: string;
  tipo: string;
  estado: string;
  fecha_de_publicacion: string;
  imagen_url: string;
  categoria: string;
};

// src/types/profile.ts

export type HistoryItem = {
  title: string;
  date: string;
};

export type Favorite = {
  title: string;
};

export interface Subscription {
  expiresAt: string;
}

export type Role = {
  name?: string;
};

export interface Profile {
  name: string;
  lastName: string;
  email: string;
  role?: Role;
  subscription?: Subscription;
  history?: HistoryItem[];
  favorites?: Favorite[];
}

