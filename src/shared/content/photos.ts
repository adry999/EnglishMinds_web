import type { ImageMetadata } from 'astro';
import boyReading from '@assets/photos/boy-reading.jpg';
import classPhoto from '@assets/photos/class.jpg';
import emaReading from '@assets/photos/ema-reading.jpg';
import group from '@assets/photos/group.jpg';
import hands from '@assets/photos/hands.jpg';
import teacherEma from '@assets/photos/teacher-ema.jpg';
import type { PhotoKey } from './site';

export const photos: Readonly<Record<PhotoKey, ImageMetadata>> = {
  class: classPhoto,
  hands,
  group,
  boyReading,
  teacherEma,
  emaReading,
};
