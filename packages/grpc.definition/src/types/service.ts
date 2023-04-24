import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { CoreServiceClient as _core_CoreServiceClient, CoreServiceDefinition as _core_CoreServiceDefinition } from './core/CoreService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  core: {
    CoreService: SubtypeConstructor<typeof grpc.Client, _core_CoreServiceClient> & { service: _core_CoreServiceDefinition }
    GetUserByIdInput: MessageTypeDefinition
    User: MessageTypeDefinition
  }
}

