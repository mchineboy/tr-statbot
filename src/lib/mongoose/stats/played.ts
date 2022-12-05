import PlayingSchema from "../playing";

export const getTotalPlayingHours = async (uid: string) => {
  return await PlayingSchema.aggregate([
    {
        $match: {
            uid: uid
        }
    },
    {
      $group: {
        _id: "$uid",
        total: { $sum: "$song.songObj.duration" },
      },
    },
  ]);
};
