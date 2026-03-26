import {
  type Script,
  defaultProcedureExport,
  defaultScript,
} from "@/lib/types/script";

export const rust = ``;

export const masm = `# Multi-Signature RPO Falcon 512 Authentication Component With GUARDIAN

use openzeppelin::auth::multisig
use openzeppelin::auth::guardian

type BeWord = struct @bigendian { a: felt, b: felt, c: felt, d: felt }

pub use multisig::update_signers_and_threshold
pub use multisig::update_procedure_threshold
pub use guardian::update_guardian_public_key
pub use guardian::verify_guardian_signature

pub proc auth_tx_multisig_guardian(salt: BeWord)
    exec.multisig::auth_tx
    exec.guardian::verify_guardian_signature
    exec.multisig::assert_new_tx
end
`;

const authMultisigGuardian: Script = {
  ...defaultScript(),
  id: "auth-multisig-guardian",
  name: "auth-multisig-guardian",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "update_signers_and_threshold",
    },
    {
      ...defaultProcedureExport(),
      path: "update_procedure_threshold",
    },
    {
      ...defaultProcedureExport(),
      path: "update_guardian_public_key",
      digest:
        "0x35498ce6e3bc24ae0e0094dc54a09b8b2bbcbc28607f86ba25684cd4a2d8f55b",
    },
    {
      ...defaultProcedureExport(),
      path: "verify_guardian_signature",
      digest:
        "0x2f1b90e9d89f1a541dd8621444edba9d3e0a66ef54147ebf59bf964969b9dfd1",
    },
    {
      ...defaultProcedureExport(),
      path: "auth_tx_multisig_guardian",
    },
  ],
};

export default authMultisigGuardian;
