import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

export const createGrpcClient = async (
  protoPath: string,
  packageName: string,
  serviceName: string,
  port: string,
) => {
  const GRPC_PORT = port || process.env.GRPC_PORT;

  const packageDef = protoLoader.loadSync(protoPath, {});
  const grpcObject = grpc.loadPackageDefinition(packageDef) as any;

  const grpcPackage = grpcObject[packageName];
  if (!grpcPackage) {
    throw new Error(`Package ${packageName} not found in proto`);
  }

  const ServiceClient = grpcPackage[serviceName];
  if (!ServiceClient) {
    throw new Error(
      `Service "${serviceName}" not found in package "${packageName}"`,
    );
  }

  const client = new grpcPackage[packageName](
    `localhost:${GRPC_PORT}`,
    grpc.credentials.createInsecure(),
  );
  return client;
};
