import { Info } from "./playing";

export interface Playlist {
  entries: PlaylistEntry[];
  name: string;
  id: string;
}

export interface PlaylistEntry extends Info {
  id?: string;
  text?: string;
}
