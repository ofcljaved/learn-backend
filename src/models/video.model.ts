import { Schema, Types, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

interface IVideo {
  videoFile: string;
  thumbnail: string;
  owner: Types.ObjectId;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
}

const videoSchema = new Schema<IVideo>(
  {
    videoFile: { type: String, required: true },
    thumbnail: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video', videoSchema);
