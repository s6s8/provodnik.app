interface GuidePhotoGridProps {
  photos: { id: string; locationName: string; imageUrl: string }[];
}

export function GuidePhotoGrid({ photos }: GuidePhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold">Локации</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(photo => (
          <div key={photo.id} className="relative overflow-hidden rounded-xl">
            <img
              src={photo.imageUrl}
              alt={photo.locationName}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
              <p className="text-xs font-medium text-white">{photo.locationName}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
