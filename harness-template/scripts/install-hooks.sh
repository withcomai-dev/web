#!/bin/bash
# install-hooks.sh — git 훅을 scripts/hooks/ 로 연결 (최초 1회 실행)
#
# core.hooksPath 를 scripts/hooks 로 지정하여 커밋된 훅을 활성화한다.
# 새 머신·새 clone 마다 1회 실행하면 된다.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/scripts/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "❌ $HOOKS_DIR 가 없습니다. 템플릿 hooks 를 복사했는지 확인하세요."
  exit 1
fi

# 실행 권한 부여
chmod +x "$HOOKS_DIR"/post-commit "$HOOKS_DIR"/pre-push "$HOOKS_DIR"/pre-merge-commit 2>/dev/null || true

# core.hooksPath 연결
git config core.hooksPath scripts/hooks

echo "✅ git 훅 연결 완료 — core.hooksPath = scripts/hooks"
echo "   - post-commit:      {{MAIN_BRANCH}} 커밋 시 백그라운드 프로덕션 배포"
echo "   - pre-push:         {{MAIN_BRANCH}} 직접 push 차단 (sentinel 필요)"
echo "   - pre-merge-commit: {{MAIN_BRANCH}} 직접 머지 차단 (sentinel 필요)"
echo ""
echo "⚠️  훅을 끄려면: git config --unset core.hooksPath"
