export class StoragePath {
  static productImage(productId: string, filename: string) {
    return `products/${productId}/images/${filename}`;
  }

  static productThumbnail(productId: string) {
    return `products/${productId}/thumbnail/thumb.jpg`;
  }

  static reviewMedia(reviewId: string, filename: string) {
    return `reviews/${reviewId}/${filename}`;
  }

  static postThumbnail(postId: string) {
    return `posts/thumbnails/${postId}.jpg`;
  }

  static userAvatar(userId: string) {
    return `users/avatars/${userId}.jpg`;
  }
}
