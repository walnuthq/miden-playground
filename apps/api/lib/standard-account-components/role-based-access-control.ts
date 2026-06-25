import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const roleBasedAccessControl: Package = {
  ...defaultPackage(),
  id: "role-based-access-control",
  name: "role-based-access-control",
  type: "account",
  digest: "0x8790c005448c81ec114fa9d6d313c7aca4d90e97df42e4d18083153e1f546fc0",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::assert_sender_has_role",
        digest:
          "0xce172bde9c4a9db5aca6f27f6380767409818edb0965cc345ba40a29ae59dd50",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::get_role_admin",
        digest:
          "0xeea75081462e35d92f7331c958362dab1806fbc6e764ccaf69702118d964c7a1",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::get_role_member_count",
        digest:
          "0x334cff9e1a1f38dd5df2c490156f1124e150be88cf971766a1c4686d8887f24f",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::grant_role",
        digest:
          "0x539172b0005a0ad1e18ed3e3f2509b4d7d12bdf1f92bcc5aa742647cd0da4b97",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::has_role",
        digest:
          "0xcbdedd4ca87e44cc9cb6a4d575cb64aead8efba2f22f14f3a0570a1d7a671dbe",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::renounce_role",
        digest:
          "0x63e0d35f84de8e60c81091927461b1d4e20b94a8ec20d071e1126f3dbf934af4",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::revoke_role",
        digest:
          "0x4a86712fc078fe1c25610058126d6c106ad69da8fa11caba9b94d0fff8fef971",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::access::rbac::set_role_admin",
        digest:
          "0xbd26c553bf6e1a29cf190a966b8a027b19f4f76eef584cd4d6db84b8b05901d0",
      },
    },
  ],
};

export default roleBasedAccessControl;
