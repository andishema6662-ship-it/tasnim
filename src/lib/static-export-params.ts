import { modules } from "./modules";
import { createSeed } from "./seed";

export function staticStoryIds() {
  return createSeed().stories.map((story) => ({ id: story.id }));
}

export function staticAlbumIds() {
  return createSeed().albums.map((album) => ({ id: album.id }));
}

export function staticDossierIds() {
  return createSeed().specialDossiers.map((dossier) => ({ id: dossier.id }));
}

export function staticVisiblePeopleIds() {
  return createSeed().people.filter((person) => person.visible).map((person) => ({ id: person.id }));
}

export function staticColleagueIds() {
  return createSeed().people.map((person) => ({ id: person.id }));
}

export function staticAdminModules() {
  return modules.map((module) => ({ group: module.group, slug: module.slug }));
}

export function staticCartableStoryIds() {
  const ids = ["new", ...createSeed().stories.map((story) => story.id)];
  return ids.map((id) => ({ id }));
}
