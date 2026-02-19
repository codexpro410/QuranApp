import React, { useCallback, useRef } from "react";
import {
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { mushafPages } from "@/data/mushafAssets";

const { width } = Dimensions.get("window");

type Props = {
  pages: number[];
  currentPage: number;
  onPageChange: (page: number) => void;
  flatListRef: React.RefObject<FlatList<number>>;
};

export default function MushafList({
  pages,
  currentPage,
  onPageChange,
  flatListRef,
}: Props) {

  const renderPage = useCallback(
    ({ item }: { item: number }) => (
      <TouchableOpacity activeOpacity={1} style={styles.pageContainer}>
        <Image
          source={mushafPages.find(p => p.page === item)?.image}
          style={styles.mushafImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    ),
    []
  );

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].item;
      if (page !== currentPage) {
        onPageChange(page);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <FlatList
      ref={flatListRef}
      data={pages}
      horizontal
      pagingEnabled
      inverted
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.toString()}
      renderItem={renderPage}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    width,
    height: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  mushafImage: {
    width: "100%",
    height: "100%",
  },
});
