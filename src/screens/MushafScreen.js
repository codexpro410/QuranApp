import React, { useState, useRef } from "react";
import {
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { mushafPages } from "../../data/mushafAssets";

const { width, height } = Dimensions.get("window");

export default function MushafScreen() {
  const [bookmarkPage, setBookmarkPage] = useState(null);
  const [showIndex, setShowIndex] = useState(false);

  const flatListRef = useRef();

  const saveBookmark = (page) => {
    setBookmarkPage(page);
    alert(`🔖 تم حفظ الصفحة ${page}`);
  };

  const goToBookmark = () => {
    if (bookmarkPage) {
      flatListRef.current.scrollToIndex({ index: bookmarkPage - 1, animated: true });
    } else {
      alert("❌ لم يتم حفظ أي علامة");
    }
  };

  const goToPage = (page) => {
    setShowIndex(false);
    flatListRef.current.scrollToIndex({ index: page - 1, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* FlatList للصفحات */}
      <FlatList
        ref={flatListRef}
        data={mushafPages}
        horizontal
        pagingEnabled
        inverted={true} // RTL
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.page.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageWrapper}>
            <Image source={item.image} style={styles.image} />
          </View>
        )}
      />

      {/* Toolbar أسفل الشاشة */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            saveBookmark(flatListRef.current._scrollMetrics.offset / width + 1)
          }
        >
          <Text style={styles.buttonText}>🔖 حفظ العلامة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goToBookmark}>
          <Text style={styles.buttonText}>📍 انتقل للعلامة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setShowIndex(true)}>
          <Text style={styles.buttonText}>📖 الفهرس</Text>
        </TouchableOpacity>
      </View>

      {/* Modal الفهرس */}
      <Modal visible={showIndex} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* عنوان ثابت */}
          <View style={styles.indexHeader}>
            <Text style={styles.indexHeaderText}>📖 فهرس السور</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowIndex(false)}
          >
            <Text style={styles.closeButtonText}>إغلاق الفهرس</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  imageWrapper: { width, height, justifyContent: "flex-start" }, // الصفحة تبدأ من الأعلى
  image: { width, height, resizeMode: "contain" },
  toolbar: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#000",
    paddingVertical: 8,
  },
  button: { paddingHorizontal: 10, paddingVertical: 5 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  indexHeader: {
    backgroundColor: "#111",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  indexHeaderText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  indexRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  indexText: { color: "#fff", fontSize: 16 },
  closeButton: { padding: 15, backgroundColor: "#111" },
  closeButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
