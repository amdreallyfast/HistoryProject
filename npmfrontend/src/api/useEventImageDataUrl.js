import { useQuery } from "@tanstack/react-query"
import { getImageDataUrl } from "./historyEventApi"

// The image to show for an event: its inline data URL if it has one (search results still carry
// image bytes; an image just uploaded in the editor), otherwise fetched by image Id. Revisions
// come without bytes (GetAllRevisions), and revisions sharing an image share the Id, so they
// share one cache entry and the image is downloaded once. Image rows never change, so a fetched
// image never goes stale.
export const eventImageQueryKey = (imageId) => ["eventImage", imageId]

export function useEventImageDataUrl(imageId, inlineDataUrl) {
  const needsFetch = !inlineDataUrl && !!imageId
  const { data, isLoading, isError } = useQuery({
    queryKey: eventImageQueryKey(imageId),
    queryFn: () => getImageDataUrl(imageId),
    enabled: needsFetch,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  return {
    dataUrl: inlineDataUrl || (needsFetch ? data ?? null : null),
    loading: needsFetch && isLoading,
    error: needsFetch && isError,
  }
}
