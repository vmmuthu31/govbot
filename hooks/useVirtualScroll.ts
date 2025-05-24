import { useEffect, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";

export function useVirtualScroll<T>(items: T[], pageSize: number = 10) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const loadMore = useCallback(() => {
    const start = 0;
    const end = page * pageSize;
    const nextBatch = items.slice(start, end);

    setVisibleItems(nextBatch);
    setHasMore(end < items.length);
    setPage((prev) => prev + 1);
  }, [items, page, pageSize]);

  useEffect(() => {
    loadMore();
  }, [items]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  return {
    visibleItems,
    hasMore,
    loadingRef: ref,
  };
}
