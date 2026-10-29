const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const fashionImages = {
  hero: unsplash("photo-1529139574466-a303027c1d8b", 2200),
  men: unsplash("photo-1516257984-b1b4d707412e", 1200),
  women: unsplash("photo-1539109136881-3be0616acf4b", 1200),
  editorial: unsplash("photo-1483985988355-763728e1935b", 2000),
  blazer: unsplash("photo-1591047139829-d91aecb6caea", 900),
  shirt: unsplash("photo-1603252109303-2751441dd157", 900),
  polo: unsplash("photo-1620799140408-edc6dcb6d633", 900),
  trousers: unsplash("photo-1515886657613-9f3515b0c78f", 900),
  dress: unsplash("photo-1566206091558-7f218b696731", 900),
  pants: unsplash("photo-1594633312681-425c7b97ccd1", 900),
  knitTop: unsplash("photo-1551163943-3f6a855d1153", 900),
  coat: unsplash("photo-1548126032-079a0fb0099d", 900),
} as const;
