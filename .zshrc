# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/homebrew/Caskroom/miniconda/base/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize <<<

# Added custom PATH
export PATH="/Users/gunn.kim/.local/bin:$PATH"

export OPENAI_API_KEY='sk-YQ_qfSzj8X9SdFcUJN5-RpDWay8M0mmvu77qLd_Lr-T3BlbkFJXmc0yIyOaWrPLFiS5XVhJoCc1eGWePq-Y8J7XMr0UA'
export CLAUDE_API_KEY='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'
