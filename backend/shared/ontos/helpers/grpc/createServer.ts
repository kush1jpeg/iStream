import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

export const createGrpcServer = async (
  protoPath: string,
  packageName: string,
  port: string,
) => {
  const GRPC_PORT = port || process.env.GRPC_PORT;

  const packageDef = protoLoader.loadSync(protoPath, {});
  const grpcObject = grpc.loadPackageDefinition(packageDef) as any;
  const grpcPackage = grpcObject[packageName];

  if (!grpcPackage)
    throw new Error(`Package ${packageName} not found in proto`);

  const server = new grpc.Server();

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${GRPC_PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) return reject(err);
        console.log(`gRPC server running on port ${port}`);
        resolve();
      },
    );
  });

  return { server, grpcPackage };
};
