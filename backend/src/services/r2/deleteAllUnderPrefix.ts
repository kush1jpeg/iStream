import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2 } from "../../controller/getVodKey";

const DELETE_BATCH_SIZE = 1000;

export async function deleteAllUnderPrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;
    let totalDeleted = 0;

    do {
        const listResp = await r2.send(
            new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET!,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            })
        );

        const keys = (listResp.Contents ?? [])
            .map((obj) => obj.Key)
            .filter((k): k is string => Boolean(k));

        for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
            const batch = keys.slice(i, i + DELETE_BATCH_SIZE);

            const deleteResp = await r2.send(
                new DeleteObjectsCommand({
                    Bucket: process.env.R2_BUCKET!,
                    Delete: {
                        Objects: batch.map((Key) => ({ Key })),
                        Quiet: false, // we WANT the Errors array back
                    },
                })
            );

            if (deleteResp.Errors && deleteResp.Errors.length > 0) {
                const sample = deleteResp.Errors.slice(0, 3)
                    .map((e) => `${e.Key}: ${e.Code}`)
                    .join(", ");
                throw new Error(
                    `R2 partial delete failure under ${prefix} (${deleteResp.Errors.length} objects failed, e.g. ${sample})`
                );
            }

            totalDeleted += batch.length;
        }

        continuationToken = listResp.IsTruncated
            ? listResp.NextContinuationToken
            : undefined;
    } while (continuationToken);

    console.log(`[vod-deletion] deleted ${totalDeleted} objects under ${prefix}`);
}
