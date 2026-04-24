import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const masm = `use miden::protocol::active_account
use miden::protocol::native_account
use miden::core::word

#! Increment the nonce only if the account commitment has changed
#!
#! This authentication procedure provides minimal authentication by checking if the account
#! state has actually changed during transaction execution. It compares the initial account
#! commitment with the current commitment and only increments the nonce if they differ.
#! This avoids unnecessary nonce increments for transactions that don't modify
#! the account state.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
@auth_script
pub proc auth_no_auth
    # check if the account state has changed by comparing initial and final commitments

    exec.active_account::get_initial_commitment
    # => [INITIAL_COMMITMENT, pad(16)]

    exec.active_account::compute_commitment
    # => [CURRENT_COMMITMENT, INITIAL_COMMITMENT, pad(16)]

    exec.word::eq not
    # => [has_account_state_changed, pad(16)]

    # check if this is a new account (i.e., nonce == 0); this check is needed because new
    # accounts are initialized with a non-empty state, and thus, unless the account was modified
    # during the transaction, the initial and current state commitments will be the same

    exec.active_account::get_nonce eq.0
    # => [is_new_account, has_account_state_changed, pad(16)]

    or
    # => [should_increment_nonce, pad(16)]

    # if the account has been updated or we are creating a new account, increment the nonce
    if.true
        exec.native_account::incr_nonce drop
    end
end
`;

const authNoAuth: Package = {
  ...defaultPackage(),
  id: "auth-no-auth",
  name: "auth-no-auth",
  type: "authentication-component",
  masm,
  digest: "0xdcc744a24dfa37ae9c7826267102a0fa7a081c28d2e1bfbd3784cbc6a7f0fa0e",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::auth::no_auth::auth_no_auth",
        digest:
          "0xd5dbddf4f755c4b7787de8df59da61dc15d4c1bef45541e8c043e11345703ef1",
      },
    },
  ],
};

export default authNoAuth;
