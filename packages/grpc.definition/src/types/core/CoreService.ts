// Original file: src/service.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetUserByIdInput as _core_GetUserByIdInput, GetUserByIdInput__Output as _core_GetUserByIdInput__Output } from '../core/GetUserByIdInput';
import type { User as _core_User, User__Output as _core_User__Output } from '../core/User';

export interface CoreServiceClient extends grpc.Client {
  GetUserById(argument: _core_GetUserByIdInput, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _core_GetUserByIdInput, metadata: grpc.Metadata, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _core_GetUserByIdInput, options: grpc.CallOptions, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  GetUserById(argument: _core_GetUserByIdInput, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _core_GetUserByIdInput, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _core_GetUserByIdInput, metadata: grpc.Metadata, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _core_GetUserByIdInput, options: grpc.CallOptions, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  getUserById(argument: _core_GetUserByIdInput, callback: grpc.requestCallback<_core_User__Output>): grpc.ClientUnaryCall;
  
}

export interface CoreServiceHandlers extends grpc.UntypedServiceImplementation {
  GetUserById: grpc.handleUnaryCall<_core_GetUserByIdInput__Output, _core_User>;
  
}

export interface CoreServiceDefinition extends grpc.ServiceDefinition {
  GetUserById: MethodDefinition<_core_GetUserByIdInput, _core_User, _core_GetUserByIdInput__Output, _core_User__Output>
}
