import { Schema, type Query, type Aggregate } from 'mongoose';

export interface SoftDeleteDocument {
  isDeleted: boolean;
  deletedAt?: Date;
  softDelete?: () => Promise<void>;
}

/**
 * Adds soft-delete behavior to a schema:
 *  - isDeleted + deletedAt fields
 *  - softDelete helper
 *  - automatic filtering on find/aggregate queries
 */
export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  });

  schema.methods.softDelete = async function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
  };

  schema.pre(/^find/, function hideDeleted(next) {
    const query = this as Query<unknown, unknown>;
    const currentFilter = query.getFilter() as Record<string, unknown>;
    if (currentFilter.isDeleted === undefined) {
      query.where({ isDeleted: false });
    }
    next();
  });

  schema.pre('aggregate', function hideDeletedInAggregate(next) {
    const aggregate = this as Aggregate<unknown[]>;
    const pipeline = aggregate.pipeline() as Record<string, any>[];
    const alreadyFiltered = pipeline.some((stage) => stage.$match && stage.$match.isDeleted !== undefined);

    if (!alreadyFiltered) {
      pipeline.unshift({ $match: { isDeleted: false } });
    }

    next();
  });
}
