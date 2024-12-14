import { Schema, model, Document } from 'mongoose';

interface ISequence extends Document {
  date: string;
  sequence: number;
}

const sequenceSchema = new Schema<ISequence>({
  date: { type: String, required: true, unique: true },
  sequence: { type: Number, required: true },
});

const Sequence = model<ISequence>('Sequence', sequenceSchema);

export default Sequence;